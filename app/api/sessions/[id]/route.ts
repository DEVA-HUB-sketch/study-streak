import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
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
    const { userId: _stripped, ...safeBody } = body;
    void _stripped;

    const updated = await StudySession.findByIdAndUpdate(id, safeBody, {
      new: true,
      runValidators: true,
    });

    if (!updated) return Response.json({ error: "Session not found" }, { status: 404 });

    // Sync subject stats for duration changes
    const durationDiff = updated.duration - existing.duration;
    const subjectChanged = updated.subject !== existing.subject;

    if (subjectChanged) {
      // Remove minutes from old subject, add to new subject
      await Subject.findOneAndUpdate(
        { userId: auth.userId, name: existing.subject },
        { $inc: { totalMinutes: -existing.duration, sessionCount: -1 } }
      );
      await Subject.findOneAndUpdate(
        { userId: auth.userId, name: updated.subject },
        { $inc: { totalMinutes: updated.duration, sessionCount: 1 } }
      );
    } else if (durationDiff !== 0) {
      await Subject.findOneAndUpdate(
        { userId: auth.userId, name: existing.subject },
        { $inc: { totalMinutes: durationDiff } }
      );
    }

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

    // Sync subject stats — decrement on delete
    await Subject.findOneAndUpdate(
      { userId: auth.userId, name: existing.subject },
      { $inc: { totalMinutes: -existing.duration, sessionCount: -1 } }
    );

    return Response.json({ message: "Session deleted" });
  } catch {
    return Response.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
