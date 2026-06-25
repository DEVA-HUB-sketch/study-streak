import { connectDB } from "@/lib/mongodb";
import AgentMemory from "@/models/AgentMemory";
import { getUserFromRequest } from "@/lib/auth";

/* GET — return the student's long-term memory */
export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const memory = await AgentMemory.findOne({ userId: auth.userId }).lean();
    return Response.json(memory ?? null);
  } catch (err) {
    console.error("[GET /api/agent/memory]", err);
    return Response.json({ error: "Failed to fetch memory" }, { status: 500 });
  }
}

/* PATCH — user can manually update goals / preferences */
export async function PATCH(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();

    const ALLOWED = ["preferredStudyTime", "learningStyle", "targetCGPA", "examGoals", "activeGoals"];
    const update: Record<string, unknown> = {};
    ALLOWED.forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });

    const memory = await AgentMemory.findOneAndUpdate(
      { userId: auth.userId },
      { $set: update },
      { upsert: true, new: true }
    );

    return Response.json(memory);
  } catch (err) {
    console.error("[PATCH /api/agent/memory]", err);
    return Response.json({ error: "Failed to update memory" }, { status: 500 });
  }
}
