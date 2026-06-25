import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, getAuthCookieOptions, COOKIE_NAME } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  /* Rate limit: 5 attempts per 15 minutes per IP */
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl  = await rateLimit(`login:${ip}`, 5, 15 * 60);
  if (!rl.success) {
    return Response.json(
      { error: `Too many login attempts. Please try again in ${rl.retryAfter ?? 900} seconds.` },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return Response.json({ error: "Email and password are required." }, { status: 400 });

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user)
      return Response.json({ error: "Invalid email or password." }, { status: 401 });

    /* Google-only account trying to use password login */
    if (user.authProvider === "google" && !user.password) {
      return Response.json(
        { error: "This account uses Google Sign-In. Please click 'Continue with Google'." },
        { status: 400 }
      );
    }

    if (!user.password)
      return Response.json({ error: "Invalid email or password." }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return Response.json({ error: "Invalid email or password." }, { status: 401 });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, getAuthCookieOptions());

    return Response.json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      college:     user.college,
      department:  user.department,
      totalRubies: user.totalRubies,
      rank:        user.rank,
    });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return Response.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
