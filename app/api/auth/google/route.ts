import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("[Google OAuth] GOOGLE_CLIENT_ID is not set");
    return NextResponse.json(
      { error: "Google Sign-In is not configured. GOOGLE_CLIENT_ID is missing." },
      { status: 503 }
    );
  }

  /* ── Derive app URL ─────────────────────────────────────────
     Priority:
       1. APP_URL      — server-only, always runtime (recommended for Vercel)
       2. NEXT_PUBLIC_APP_URL — baked at build time, may be stale on Vercel
       3. Derived from the incoming request headers (most reliable fallback)
  ────────────────────────────────────────────────────────────── */
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
  ).replace(/\/+$/, ""); // strip any trailing slash

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const state       = crypto.randomBytes(16).toString("hex");
  const flow        = request.nextUrl.searchParams.get("flow") ?? "login";
  const isProduction = process.env.NODE_ENV === "production";

  console.log("[Google OAuth] Initiating OAuth", {
    appUrl,
    redirectUri,
    flow,
    isProduction,
  });

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "openid email profile",
    state,
    access_type:   "offline",
    prompt:        "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const response = NextResponse.redirect(authUrl);

  /* ── State cookies — must have secure:true on HTTPS ────────
     Without secure:true, Chrome 80+ may drop cookies during the
     Google → callback redirect chain on HTTPS (Vercel).
  ────────────────────────────────────────────────────────────── */
  const cookieOpts = {
    httpOnly:  true,
    secure:    isProduction,   // ← was missing; critical for Vercel
    sameSite:  "lax" as const,
    maxAge:    600,
    path:      "/",
  };

  response.cookies.set("oauth_state", state, cookieOpts);
  response.cookies.set("oauth_flow",  flow,  cookieOpts);

  console.log("[Google OAuth] State cookie set, redirecting to Google");
  return response;
}
