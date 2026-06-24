import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { name, email, password, college, department } = await request.json();

    if (!name?.trim())
      return Response.json({ error: "Name is required" }, { status: 400 });
    if (!email?.includes("@"))
      return Response.json({ error: "A valid email is required" }, { status: 400 });
    if (!password || password.length < 8)
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    await connectDB();

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      password:   hashed,
      college:    college?.trim()    || undefined,
      department: department?.trim() || undefined,
    });

    return Response.json(
      { _id: user._id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/register]", err);

    // MongoDB duplicate key (race between findOne and create)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Mongoose validation errors — surface the first message
    if (err instanceof Error && err.name === "ValidationError") {
      const first = Object.values(
        (err as unknown as { errors: Record<string, { message: string }> }).errors
      )[0]?.message;
      return Response.json({ error: first ?? err.message }, { status: 400 });
    }

    return Response.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
