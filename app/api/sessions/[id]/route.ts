import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/sessions/[id]">
) {
  const auth = getUserFromRequest(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await ctx.params;
    const session = await StudySession.findById(id);
    if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
    if (session.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json(session);
  } catch {
    return Response.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/sessions/[id]">
) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await ctx.params;

    const existing = await StudySession.findById(id);
    if (!existing) return Response.json({ error: "Session not found" }, { status: 404 });
    if (existing.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    // Strip userId from body so callers cannot reassign ownership
    const { userId: _stripped, ...safeBody } = body;
    void _stripped;

    const updated = await StudySession.findByIdAndUpdate(id, safeBody, {
      new: true,
      runValidators: true,
    });
    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update session";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  ctx: RouteContext<"/api/sessions/[id]">
) {
  const auth = getUserFromRequest(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await ctx.params;

    const existing = await StudySession.findById(id);
    if (!existing) return Response.json({ error: "Session not found" }, { status: 404 });
    if (existing.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });

    await StudySession.findByIdAndDelete(id);
    return Response.json({ message: "Session deleted" });
  } catch {
    return Response.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
