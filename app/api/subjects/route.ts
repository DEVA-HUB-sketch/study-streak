import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import StudySession from "@/models/StudySession";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const [subjects, sessionStats] = await Promise.all([
      Subject.find({ userId: auth.userId }).sort({ name: 1 }).lean(),
      StudySession.aggregate([
        { $match: { userId: auth.userId } },
        { $group: {
          _id: "$subject",
          totalMinutes: { $sum: "$duration" },
          sessionCount:  { $sum: 1 },
        }},
      ]),
    ]);

    // Build a map of real stats from actual sessions
    const statsMap = new Map(
      sessionStats.map(s => [s._id as string, {
        totalMinutes: s.totalMinutes as number,
        sessionCount:  s.sessionCount  as number,
      }])
    );

    // Merge real stats into subject documents
    const result = subjects.map(s => ({
      ...s,
      totalMinutes: statsMap.get(s.name)?.totalMinutes ?? 0,
      sessionCount:  statsMap.get(s.name)?.sessionCount  ?? 0,
    }));

    return Response.json(result);
  } catch (err) {
    console.error("[GET /api/subjects]", err);
    return Response.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const subject = await Subject.create({ ...body, userId: auth.userId });
    return Response.json(subject, { status: 201 });
  } catch (err) {
    console.error("[POST /api/subjects]", err);
    const message = err instanceof Error ? err.message : "Failed to create subject";
    return Response.json({ error: message }, { status: 400 });
  }
}
