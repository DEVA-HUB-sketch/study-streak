import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/Subject";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/subjects/[id]">
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();
    const subject = await Subject.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!subject) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(subject);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update subject";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/subjects/[id]">
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ message: "Deleted" });
  } catch (err) {
    console.error("[DELETE /api/subjects/[id]]", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
