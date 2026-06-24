import { connectDB } from "@/lib/mongodb";
import ExamResult from "@/models/ExamResult";
import { getUserFromRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = getUserFromRequest(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { id } = await ctx.params;
    const doc = await ExamResult.findById(id);
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
    if (doc.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });
    await ExamResult.findByIdAndDelete(id);
    return Response.json({ message: "Deleted" });
  } catch (err) {
    console.error("[DELETE /api/exams/[id]]", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { id } = await ctx.params;
    const doc = await ExamResult.findById(id);
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
    if (doc.userId !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const { userId: _s, ...safe } = body; void _s;
    const updated = await ExamResult.findByIdAndUpdate(id, safe, { new: true, runValidators: true });
    return Response.json(updated);
  } catch (err) {
    console.error("[PUT /api/exams/[id]]", err);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}
