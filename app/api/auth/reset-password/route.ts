import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return Response.json({ error: "Invalid or missing reset token." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    await connectDB();

    /* Find user by hashed token — the query works regardless of select:false.
       We request resetToken explicitly so we can confirm the match. */
    const user = await User.findOne({
      resetToken:       tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    })
      .select("+resetToken _id")
      .lean();

    if (!user) {
      return Response.json(
        { error: "Reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    /* Direct $set + $unset — bypasses Mongoose select:false change-tracking.
       password and resetToken both have select:false; updateOne is the safe path. */
    await User.updateOne(
      { _id: user._id },
      {
        $set:   { password: hashed },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
