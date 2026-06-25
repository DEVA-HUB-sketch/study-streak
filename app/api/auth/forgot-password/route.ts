import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const rl = await rateLimit(`forgot:${ip}`, 3, 15 * 60);
  if (!rl.success) {
    return Response.json(
      { error: "Too many requests. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { email } = await request.json();
    if (!email?.includes("@")) {
      return Response.json({ error: "Valid email is required." }, { status: 400 });
    }

    await connectDB();

    // Lean query — we only need _id, name, email, authProvider
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("name email authProvider")
      .lean();

    // Always return success — prevents user enumeration
    if (!user || user.authProvider === "google") {
      return Response.json({ success: true });
    }

    const rawToken  = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    /* Use updateOne so we bypass Mongoose select:false tracking issues.
       This sends a direct $set to MongoDB — guaranteed to persist. */
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken:       tokenHash,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      }
    );

    await sendPasswordResetEmail(user.email, user.name, rawToken);

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
