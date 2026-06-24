import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { name, email, password, college, department } = await request.json();

    if (!name?.trim())       return Response.json({ error: "Name is required" }, { status: 400 });
    if (!email?.includes("@")) return Response.json({ error: "Valid email is required" }, { status: 400 });
    if (!password || password.length < 8)
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    await connectDB();

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return Response.json({ error: "Email already registered" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      college: college?.trim() || undefined,
      department: department?.trim() || undefined,
    });

    return Response.json(
      { _id: user._id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
