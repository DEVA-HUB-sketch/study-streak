import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/Subject";

export async function GET() {
  try {
    await connectDB();
    const subjects = await Subject.find({ userId: "guest" }).sort({ name: 1 });
    return Response.json(subjects);
  } catch (err) {
    console.error("[GET /api/subjects]", err);
    return Response.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const subject = await Subject.create({ ...body, userId: "guest" });
    return Response.json(subject, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create subject";
    return Response.json({ error: message }, { status: 400 });
  }
}
