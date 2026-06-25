import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token?:  string;
  token_type?:    string;
  expires_in?:    number;
  error?:         string;
  error_description?: string;
}
interface GoogleUserInfo {
  id?:      string;
  email?:   string;
  name?:    string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  /* ── Derive app URL (same priority as initiation route) ──── */
  const appUrl = (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (() => {
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const host  = request.headers.get("x-forwarded-host") ??
                    request.headers.get("host") ??
                    "localhost:3000";
      return `${proto}://${host}`;
    })()
  ).replace(/\/+$/, "");

  const redirectUri    = `${appUrl}/api/auth/google/callback`;
  const isProduction   = process.env.NODE_ENV === "production";
  const { searchParams } = request.nextUrl;

  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("[Google OAuth Callback] Received", {
    hasCode:  !!code,
    hasState: !!state,
    error,
    redirectUri,
    appUrl,
    isProduction,
  });

  /* ── Step 1: Google denied / user cancelled ──────────────── */
  if (error || !code) {
    console.error("[Google OAuth Callback] Step 1 FAILED — Google error or missing code", { error, code: !!code });
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
  }

  /* ── Step 2: CSRF state validation ──────────────────────── */
  const storedState = request.cookies.get("oauth_state")?.value;
  const flow        = request.cookies.get("oauth_flow")?.value ?? "login";

  console.log("[Google OAuth Callback] Step 2 — CSRF check", {
    storedState: storedState ? `${storedState.slice(0, 8)}…` : "MISSING",
    receivedState: state ? `${state.slice(0, 8)}…` : "MISSING",
    stateMatch: storedState === state,
    flow,
    allCookies: request.cookies.getAll().map(c => c.name),
  });

  if (!storedState || storedState !== state) {
    console.error(
      "[Google OAuth Callback] Step 2 FAILED — State mismatch or missing cookie." +
      " This usually means the oauth_state cookie was not sent back (missing secure flag in production)." +
      ` storedState=${storedState ?? "MISSING"} receivedState=${state}`
    );
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  function clearOAuthCookies(res: NextResponse) {
    const deleteOpts = { path: "/", maxAge: 0, httpOnly: true, secure: isProduction, sameSite: "lax" as const };
    res.cookies.set("oauth_state", "", deleteOpts);
    res.cookies.set("oauth_flow",  "", deleteOpts);
    return res;
  }

  try {
    /* ── Step 3: Exchange code for access token ───────────── */
    console.log("[Google OAuth Callback] Step 3 — Token exchange", { redirectUri });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  redirectUri,
      }),
    });

    const tokenStatus = tokenRes.status;
    const tokens      = await tokenRes.json() as GoogleTokenResponse;

    console.log("[Google OAuth Callback] Step 3 result", {
      httpStatus:     tokenStatus,
      hasAccessToken: !!tokens.access_token,
      tokenError:     tokens.error ?? null,
      tokenErrorDesc: tokens.error_description ?? null,
    });

    if (!tokens.access_token) {
      throw new Error(
        `Token exchange failed (HTTP ${tokenStatus}): ${tokens.error ?? "unknown"} — ${tokens.error_description ?? "no description"}`
      );
    }

    /* ── Step 4: Fetch Google profile ────────────────────── */
    console.log("[Google OAuth Callback] Step 4 — Fetching Google profile");

    const userRes    = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json() as GoogleUserInfo;

    console.log("[Google OAuth Callback] Step 4 result", {
      httpStatus: userRes.status,
      hasEmail:   !!googleUser.email,
      hasName:    !!googleUser.name,
      hasId:      !!googleUser.id,
    });

    if (!googleUser.email) {
      throw new Error(`Google profile missing email (HTTP ${userRes.status})`);
    }

    /* ── Step 5: MongoDB — find or create user ───────────── */
    console.log("[Google OAuth Callback] Step 5 — MongoDB lookup", { email: googleUser.email, flow });

    await connectDB();
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    console.log("[Google OAuth Callback] Step 5 result", {
      userFound:      !!user,
      authProvider:   user?.authProvider ?? null,
    });

    if (!user) {
      if (flow === "login") {
        console.log("[Google OAuth Callback] Step 5 — No account, login flow → redirect to signup");
        const res = NextResponse.redirect(`${appUrl}/login?error=google_not_registered`);
        return clearOAuthCookies(res);
      }

      console.log("[Google OAuth Callback] Step 5 — Creating new Google user");
      user = await User.create({
        name:         googleUser.name ?? "Student",
        email:        googleUser.email.toLowerCase(),
        googleId:     googleUser.id,
        authProvider: "google",
        avatarUrl:    googleUser.picture ?? undefined,
      });
      console.log("[Google OAuth Callback] Step 5 — New user created", { userId: user._id.toString() });
    } else {
      let changed = false;
      if (!user.googleId) { user.googleId = googleUser.id; changed = true; }
      if (!user.avatarUrl && googleUser.picture) { user.avatarUrl = googleUser.picture; changed = true; }
      if (changed) {
        await user.save();
        console.log("[Google OAuth Callback] Step 5 — Existing user updated (linked Google)");
      }
    }

    /* ── Step 6: Issue JWT cookie ────────────────────────── */
    console.log("[Google OAuth Callback] Step 6 — Signing JWT and setting cookie", {
      userId:      user._id.toString(),
      cookieName:  COOKIE_NAME,
      isProduction,
    });

    const token      = signToken({ userId: user._id.toString(), email: user.email });
    const cookieOpts = getAuthCookieOptions();

    console.log("[Google OAuth Callback] Step 6 — Cookie options", {
      ...cookieOpts,
      // Don't log the token itself
    });

    /* ── Step 7: Redirect to dashboard ──────────────────── */
    const destination = `${appUrl}/dashboard`;
    console.log("[Google OAuth Callback] Step 7 — Redirecting to", destination);

    const res = NextResponse.redirect(destination);
    res.cookies.set(COOKIE_NAME, token, cookieOpts);
    return clearOAuthCookies(res);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Google OAuth Callback] PIPELINE FAILED", {
      message,
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5).join(" | ") : null,
      appUrl,
      redirectUri,
      isProduction,
      hasClientId:     !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasMongoUri:     !!process.env.MONGODB_URI,
      hasJwtSecret:    !!process.env.JWT_SECRET,
    });

    const res = NextResponse.redirect(`${appUrl}/login?error=google_failed`);
    return clearOAuthCookies(res);
  }
}
