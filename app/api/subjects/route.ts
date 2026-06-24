import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const subjects = await Subject.find({ userId: auth.userId }).sort({ name: 1 });
    return Response.json(subjects);
  } catch (err) {
    console.error("[GET /api/subjects]", err);
    return Response.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const subject = await Subject.create({ ...body, userId: auth.userId });
    return Response.json(subject, { status: 201 });
  } catch (err) {
    console.error("[POST /api/subjects]", err);
    const message = err instanceof Error ? err.message : "Failed to create subject";
    return Response.json({ error: message }, { status: 400 });
  }
}
