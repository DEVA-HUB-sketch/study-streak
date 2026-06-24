import { connectDB } from "@/lib/mongodb";
import PinnedTimetable from "@/models/PinnedTimetable";
import { getUserFromRequest } from "@/lib/auth";

/* GET — fetch the user's pinned timetable (one per user) */
export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const doc = await PinnedTimetable.findOne({ userId: auth.userId }).lean();
    if (!doc) return Response.json(null);
    return Response.json(doc);
  } catch (err) {
    console.error("[GET /api/timetable]", err);
    return Response.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}

/* POST — pin (or replace) a timetable */
export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();

    const doc = await PinnedTimetable.findOneAndUpdate(
      { userId: auth.userId },
      {
        userId:             auth.userId,
        course:             body.course             ?? "",
        subjects:           body.subjects           ?? "",
        examDate:           body.examDate,
        studyHours:         body.studyHours         ?? "6",
        examReadinessScore: body.examReadinessScore ?? 0,
        timetable:          body.timetable          ?? [],
        weeklyRoadmap:      body.weeklyRoadmap       ?? [],
        reviewed:           false,
        reviewRating:       undefined,
        reviewText:         undefined,
      },
      { upsert: true, new: true }
    );

    return Response.json(doc, { status: 201 });
  } catch (err) {
    console.error("[POST /api/timetable]", err);
    return Response.json({ error: "Failed to pin timetable" }, { status: 500 });
  }
}

/* PATCH — save review then delete */
export async function PATCH(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { reviewRating, reviewText } = await request.json();

    await PinnedTimetable.findOneAndUpdate(
      { userId: auth.userId },
      { reviewed: true, reviewRating, reviewText }
    );
    return Response.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/timetable]", err);
    return Response.json({ error: "Failed to save review" }, { status: 500 });
  }
}

/* DELETE — remove the pinned timetable */
export async function DELETE(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    await PinnedTimetable.findOneAndDelete({ userId: auth.userId });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/timetable]", err);
    return Response.json({ error: "Failed to remove timetable" }, { status: 500 });
  }
}
