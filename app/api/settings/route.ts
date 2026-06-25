import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

/* PATCH /api/settings — change password */
export async function PATCH(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Both current and new passwords are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return Response.json({ error: "New password must differ from current password." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(auth.userId).select("+password");
    if (!user) return Response.json({ error: "User not found." }, { status: 404 });

    if (user.authProvider === "google" && !user.password) {
      return Response.json({ error: "Your account uses Google Sign-In. Password cannot be changed here." }, { status: 400 });
    }

    if (!user.password) {
      return Response.json({ error: "No password set for this account." }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return Response.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return Response.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/settings]", err);
    return Response.json({ error: "Failed to update password." }, { status: 500 });
  }
}
