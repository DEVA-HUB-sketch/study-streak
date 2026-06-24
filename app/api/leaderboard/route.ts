import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies } from "@/lib/rubies";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const sessions = await StudySession.find({ userId: auth.userId }).lean();
    const totalSessions = sessions.length;
    const totalMinutes  = sessions.reduce((acc, s) => acc + s.duration, 0);
    const { currentStreak, longestStreak } = computeStreaks(sessions.map((s) => s.date));
    const totalRubies = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);

    const user = await User.findById(auth.userId).lean();

    const entry = {
      rank: 1,
      username: user?.name ?? "Student",
      hoursStudied: +(totalMinutes / 60).toFixed(1),
      totalSessions,
      totalRubies,
      streak: currentStreak,
      isCurrentUser: true,
    };

    return Response.json([entry]);
  } catch (err) {
    console.error("[GET /api/leaderboard]", err);
    return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
