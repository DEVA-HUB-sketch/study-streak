import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const PROTECTED = ["/dashboard", "/leaderboard", "/achievements", "/profile", "/subjects", "/sessions", "/ai", "/resources", "/challenges", "/progress", "/exams", "/settings", "/study-assistant", "/career", "/weekly-report", "/calendar"];
const AUTH_ONLY = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY.some((p) => pathname.startsWith(p));

  const isValid = token ? verifyToken(token) !== null : false;

  if (isProtected && !isValid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthOnly && isValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leaderboard/:path*",
    "/achievements/:path*",
    "/profile/:path*",
    "/subjects/:path*",
    "/sessions/:path*",
    "/ai/:path*",
    "/resources/:path*",
    "/challenges/:path*",
    "/progress/:path*",
    "/exams/:path*",
    "/settings/:path*",
    "/study-assistant/:path*",
    "/career/:path*",
    "/weekly-report/:path*",
    "/calendar/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
