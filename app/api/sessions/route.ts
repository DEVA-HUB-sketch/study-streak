import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";

export async function GET() {
  try {
    await connectDB();
    const sessions = await StudySession.find().sort({ date: -1 });
    return Response.json(sessions);
  } catch (err) {
    console.error("[GET /api/sessions]", err);
    return Response.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const session = await StudySession.create(body);
    return Response.json(session, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    return Response.json({ error: message }, { status: 400 });
  }
}
