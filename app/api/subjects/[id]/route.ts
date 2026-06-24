import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/subjects/[id]">
) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await ctx.params;

    const existing = await Subject.findById(id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { userId: _stripped, ...safeBody } = body;
    void _stripped;

    const updated = await Subject.findByIdAndUpdate(id, safeBody, { new: true, runValidators: true });
    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update subject";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  ctx: RouteContext<"/api/subjects/[id]">
) {
  const auth = getUserFromRequest(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await ctx.params;

    const existing = await Subject.findById(id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });

    await Subject.findByIdAndDelete(id);
    return Response.json({ message: "Deleted" });
  } catch (err) {
    console.error("[DELETE /api/subjects/[id]]", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
