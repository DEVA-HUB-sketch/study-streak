import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const sessions = await StudySession.find({ userId: auth.userId }).sort({ date: -1 });
    return Response.json(sessions);
  } catch (err) {
    console.error("[GET /api/sessions]", err);
    return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const session = await StudySession.create({ ...body, userId: auth.userId });

    // Sync subject stats — increment if a Subject document exists for this name
    if (session.subject && session.duration) {
      await Subject.findOneAndUpdate(
        { userId: auth.userId, name: session.subject },
        { $inc: { totalMinutes: session.duration, sessionCount: 1 } }
      );
    }

    return Response.json(session, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sessions]", err);
    const isValidation = err instanceof Error && err.name === "ValidationError";
    return Response.json(
      { error: isValidation ? err.message : "Failed to create session" },
      { status: isValidation ? 400 : 500 }
    );
  }
}
