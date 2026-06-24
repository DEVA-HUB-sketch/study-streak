import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

const ALLOWED = ["name", "college", "department", "academicYear", "goals", "examTarget"] as const;
type AllowedField = typeof ALLOWED[number];

export async function PATCH(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Only allow whitelisted fields to prevent mass-assignment
    const update: Partial<Record<AllowedField, string>> = {};
    for (const key of ALLOWED) {
      if (typeof body[key] === "string") {
        update[key] = body[key].trim();
      }
    }

    if (update.name !== undefined && update.name.length < 1) {
      return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json(user);
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
