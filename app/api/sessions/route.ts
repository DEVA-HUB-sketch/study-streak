import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const sessions = await StudySession.find({ userId: auth.userId }).sort({ date: -1 });
    return Response.json(sessions);
  } catch (err) {
    console.error("[GET /api/sessions]", err);
    return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const session = await StudySession.create({ ...body, userId: auth.userId });
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
