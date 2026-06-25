/**
 * GET /api/agent/state
 *
 * Returns cached AgentState if still valid (within 3-hour window).
 * If stale or missing, returns null — the client should trigger POST /api/agent/run.
 * This keeps the dashboard fast on repeat visits.
 */
import { connectDB } from "@/lib/mongodb";
import AgentState from "@/models/AgentState";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const state = await AgentState.findOne({ userId: auth.userId }).lean();

    if (!state) return Response.json(null);

    /* Return cached state if still valid */
    const isValid = state.validUntil && new Date(state.validUntil) > new Date();
    if (isValid) return Response.json(state);

    /* Stale — signal client to re-run */
    return Response.json({ stale: true, ...state });
  } catch (err) {
    console.error("[GET /api/agent/state]", err);
    return Response.json({ error: "Failed to fetch agent state" }, { status: 500 });
  }
}
