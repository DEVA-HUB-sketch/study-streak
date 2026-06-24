import { connectDB } from "@/lib/mongodb";
import TestResult from "@/models/TestResult";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const results = await TestResult
      .find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-questions") // exclude question detail for list view
      .lean();
    return Response.json(results);
  } catch (err) {
    console.error("[GET /api/challenges/history]", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
