import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth";

interface GoogleTokenResponse { access_token?: string; error?: string; }
interface GoogleUserInfo { id?: string; email?: string; name?: string; picture?: string; }

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { searchParams } = request.nextUrl;

  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
  }

  /* ── CSRF validation ───────────────────────────────────────── */
  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  /* ── Read the flow (login vs signup) ──────────────────────── */
  const flow = request.cookies.get("oauth_flow")?.value ?? "login";

  function clearOAuthCookies(res: NextResponse) {
    res.cookies.delete("oauth_state");
    res.cookies.delete("oauth_flow");
    return res;
  }

  try {
    /* ── Exchange code for access token ───────────────────────── */
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  `${appUrl}/api/auth/google/callback`,
      }),
    });

    const tokens = await tokenRes.json() as GoogleTokenResponse;
    if (!tokens.access_token) throw new Error("No access token returned from Google");

    /* ── Fetch Google profile ─────────────────────────────────── */
    const userRes  = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json() as GoogleUserInfo;
    if (!googleUser.email) throw new Error("No email in Google profile");

    await connectDB();

    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (!user) {
      /* ── No existing account ──────────────────────────────── */
      if (flow === "login") {
        // LOGIN flow: refuse unregistered users — tell them to sign up first
        const res = NextResponse.redirect(`${appUrl}/login?error=google_not_registered`);
        return clearOAuthCookies(res);
      }

      // SIGNUP flow: create the account
      user = await User.create({
        name:         googleUser.name ?? "Student",
        email:        googleUser.email.toLowerCase(),
        googleId:     googleUser.id,
        authProvider: "google",
        avatarUrl:    googleUser.picture ?? undefined,
      });
    } else {
      /* ── Existing account — link Google if needed ─────────── */
      let changed = false;
      if (!user.googleId) { user.googleId = googleUser.id; changed = true; }
      if (!user.avatarUrl && googleUser.picture) { user.avatarUrl = googleUser.picture; changed = true; }
      if (changed) await user.save();
    }

    /* ── Issue JWT cookie (same flow as email/password login) ─── */
    const token = signToken({ userId: user._id.toString(), email: user.email });

    const res = NextResponse.redirect(`${appUrl}/dashboard`);
    res.cookies.set(COOKIE_NAME, token, getAuthCookieOptions());
    return clearOAuthCookies(res);

  } catch (err) {
    console.error("[Google OAuth callback]", err);
    const res = NextResponse.redirect(`${appUrl}/login?error=google_failed`);
    return clearOAuthCookies(res);
  }
}
