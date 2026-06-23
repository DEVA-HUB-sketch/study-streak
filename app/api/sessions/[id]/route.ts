import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/sessions/[id]">
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const session = await StudySession.findById(id);
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    return Response.json(session);
  } catch {
    return Response.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/sessions/[id]">
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();
    const session = await StudySession.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    return Response.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update session";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/sessions/[id]">
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const session = await StudySession.findByIdAndDelete(id);
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    return Response.json({ message: "Session deleted" });
  } catch {
    return Response.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
