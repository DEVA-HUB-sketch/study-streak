import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies } from "@/lib/rubies";
import { BADGES, AchievementStats } from "@/lib/constants";
import { getUserFromRequest } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const sessions = await StudySession.find({ userId: auth.userId }).sort({ date: 1 }).lean();

    const totalSessions = sessions.length;
    const totalMinutes  = sessions.reduce((acc, s) => acc + s.duration, 0);

    const { currentStreak, longestStreak, studiedDates, weekGrid } =
      computeStreaks(sessions.map((s) => s.date));

    const totalRubies = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);

    const achievementStats: AchievementStats = {
      totalSessions, currentStreak, longestStreak, totalMinutes, totalRubies,
    };
    const unlockedBadgeIds = BADGES.filter((b) => b.condition(achievementStats)).map((b) => b.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const recentSessions = sessions.filter((s) => new Date(s.date) >= thirtyDaysAgo);
    const dailyMap: Record<string, number> = {};
    recentSessions.forEach((s) => {
      const key = format(new Date(s.date), "MMM dd");
      dailyMap[key] = (dailyMap[key] ?? 0) + s.duration;
    });

    const chartLabels: string[] = [];
    const chartData: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = format(d, "MMM dd");
      chartLabels.push(label);
      chartData.push(dailyMap[label] ?? 0);
    }

    const subjectMap: Record<string, number> = {};
    sessions.forEach((s) => {
      subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration;
    });

    return Response.json({
      totalSessions, totalMinutes, currentStreak, longestStreak,
      totalRubies, weekGrid, studiedDates, unlockedBadgeIds,
      chart: { labels: chartLabels, data: chartData },
      subjectBreakdown: subjectMap,
    });
  } catch (err) {
    console.error("[GET /api/stats]", err);
    return Response.json({ error: "Failed to compute stats" }, { status: 500 });
  }
}
