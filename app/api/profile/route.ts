import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

const STRING_FIELDS  = ["name", "college", "department", "academicYear", "goals", "examTarget"] as const;
const NUMBER_FIELDS  = ["targetCGPA", "preferredStudyHours"] as const;

type StringField = typeof STRING_FIELDS[number];
type NumberField = typeof NUMBER_FIELDS[number];

export async function PATCH(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Whitelist string fields (prevent mass-assignment)
    const update: Partial<Record<StringField | NumberField, string | number>> = {};

    for (const key of STRING_FIELDS) {
      if (typeof body[key] === "string") {
        update[key] = body[key].trim();
      }
    }

    // Whitelist numeric fields with range validation
    for (const key of NUMBER_FIELDS) {
      if (body[key] !== undefined && body[key] !== "") {
        const val = Number(body[key]);
        if (!isNaN(val)) {
          if (key === "targetCGPA"           && (val < 0 || val > 10))  continue;
          if (key === "preferredStudyHours"  && (val < 0 || val > 24))  continue;
          update[key] = val;
        }
      }
    }

    if (typeof update.name === "string" && update.name.length < 1) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!user) return Response.json({ error: "User not found." }, { status: 404 });

    return Response.json(user);
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return Response.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
