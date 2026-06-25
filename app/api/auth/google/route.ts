import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google Sign-In is not configured. Please add GOOGLE_CLIENT_ID to your environment variables." },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const state  = crypto.randomBytes(16).toString("hex");

  /* flow = "login" (default) → only existing users allowed
     flow = "signup"          → create account if not exists */
  const flow = request.nextUrl.searchParams.get("flow") ?? "login";

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${appUrl}/api/auth/google/callback`,
    response_type: "code",
    scope:         "openid email profile",
    state,
    access_type:   "offline",
    prompt:        "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("oauth_state", state, {
    httpOnly: true, sameSite: "lax", maxAge: 600, path: "/",
  });
  // Store the flow so the callback knows whether to create accounts
  response.cookies.set("oauth_flow", flow, {
    httpOnly: true, sameSite: "lax", maxAge: 600, path: "/",
  });

  return response;
}
