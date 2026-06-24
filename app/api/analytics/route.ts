import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import { getUserFromRequest } from "@/lib/auth";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies } from "@/lib/rubies";
import { BADGES, AchievementStats } from "@/lib/constants";
import { format, subDays, parseISO } from "date-fns";

export interface SubjectStat { minutes: number; sessions: number; hours: number; }

export interface Analytics {
  /* core */
  totalHours:        number;
  totalMinutes:      number;
  totalSessions:     number;
  studyDaysCount:    number;
  currentStreak:     number;
  longestStreak:     number;
  totalRubies:       number;
  achievementCount:  number;
  totalBadges:       number;

  /* subjects */
  subjectBreakdown:     Record<string, SubjectStat>;
  subjectCount:         number;
  mostStudiedSubject:   (SubjectStat & { name: string }) | null;
  leastStudiedSubject:  (SubjectStat & { name: string }) | null;

  /* time trends */
  weeklyTrend:          { date: string; label: string; minutes: number }[];
  thisWeekMinutes:      number;
  lastWeekMinutes:      number;
  weeklyChangePercent:  number;
  avgDailyMinutes:      number;

  /* AI-derived */
  productivityScore:    number;
  burnoutRisk:          boolean;
  burnoutReason:        string;
  nextBadge:            { name: string; daysNeeded: number } | null;
  todayInsight:         string;
  insightType:          "warning" | "achievement" | "improvement" | "suggestion" | "motivation";
}

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const sessions = await StudySession.find({ userId: auth.userId }).sort({ date: 1 }).lean();

    /* ── Core metrics ──────────────────────────────────────── */
    const totalSessions = sessions.length;
    const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
    const totalHours    = +(totalMinutes / 60).toFixed(1);

    const { currentStreak, longestStreak, studiedDates } = computeStreaks(sessions.map(s => s.date));
    const studyDaysCount = studiedDates.length;

    const totalRubies = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);

    const achievementStats: AchievementStats = { totalSessions, currentStreak, longestStreak, totalMinutes, totalRubies };
    const achievementCount = BADGES.filter(b => b.condition(achievementStats)).length;
    const totalBadges      = BADGES.length;

    /* ── Subject breakdown ─────────────────────────────────── */
    const subjectMap: Record<string, SubjectStat> = {};
    sessions.forEach(s => {
      if (!subjectMap[s.subject]) subjectMap[s.subject] = { minutes: 0, sessions: 0, hours: 0 };
      subjectMap[s.subject].minutes  += s.duration;
      subjectMap[s.subject].sessions += 1;
    });
    Object.values(subjectMap).forEach(v => { v.hours = +(v.minutes / 60).toFixed(1); });

    const subjectEntries = Object.entries(subjectMap);
    const subjectCount   = subjectEntries.length;

    const mostStudiedEntry  = subjectEntries.length > 0
      ? subjectEntries.reduce((a, b) => a[1].minutes > b[1].minutes ? a : b)
      : null;
    const leastStudiedEntry = subjectEntries.length > 1
      ? subjectEntries.reduce((a, b) => a[1].minutes < b[1].minutes ? a : b)
      : null;

    const mostStudiedSubject  = mostStudiedEntry
      ? { name: mostStudiedEntry[0], ...mostStudiedEntry[1] } : null;
    const leastStudiedSubject = leastStudiedEntry
      ? { name: leastStudiedEntry[0], ...leastStudiedEntry[1] } : null;

    /* ── Weekly trend (last 7 days) ────────────────────────── */
    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const mins = sessions
        .filter(s => format(parseISO(typeof s.date === "string" ? s.date : s.date.toISOString().slice(0, 10)), "yyyy-MM-dd") === dateStr)
        .reduce((a, s) => a + s.duration, 0);
      return { date: dateStr, label: format(d, "EEE"), minutes: mins };
    });

    /* ── Week-over-week comparison ─────────────────────────── */
    const now           = new Date();
    const weekStart     = subDays(now, 6);
    const prevWeekStart = subDays(now, 13);

    const thisWeekMinutes = sessions
      .filter(s => new Date(s.date) >= weekStart)
      .reduce((a, s) => a + s.duration, 0);

    const lastWeekMinutes = sessions
      .filter(s => { const d = new Date(s.date); return d >= prevWeekStart && d < weekStart; })
      .reduce((a, s) => a + s.duration, 0);

    const weeklyChangePercent = lastWeekMinutes > 0
      ? +(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100).toFixed(1)
      : 0;

    /* ── Derived metrics ───────────────────────────────────── */
    const avgDailyMinutes = studyDaysCount > 0 ? Math.round(totalMinutes / studyDaysCount) : 0;

    /* ── Burnout detection: 7+ consecutive days with avg ≥ 240 min ── */
    const burnoutRisk   = currentStreak >= 7 && avgDailyMinutes >= 240;
    const burnoutReason = burnoutRisk
      ? `You've averaged ${Math.round(avgDailyMinutes / 60)}h/day for ${currentStreak} consecutive days.`
      : "";

    /* ── Productivity score (0-100) ────────────────────────── */
    const streakFactor  = Math.min((currentStreak / 30) * 40, 40);
    const volumeFactor  = Math.min((avgDailyMinutes / 120) * 40, 40);
    const varietyFactor = Math.min((subjectCount / 5) * 20, 20);
    const productivityScore = Math.round(streakFactor + volumeFactor + varietyFactor);

    /* ── Next badge ────────────────────────────────────────── */
    const streakMilestones = [
      { streak: 7,  name: "7-Day Warrior" },
      { streak: 30, name: "30-Day Master"  },
    ];
    const nextMilestone = streakMilestones.find(m => currentStreak < m.streak);
    const nextBadge = nextMilestone
      ? { name: nextMilestone.name, daysNeeded: nextMilestone.streak - currentStreak }
      : null;

    /* ── Today's insight (rule-based, priority order) ──────── */
    let todayInsight = "";
    let insightType: Analytics["insightType"] = "motivation";

    if (burnoutRisk) {
      todayInsight = `You've averaged ${Math.round(avgDailyMinutes / 60)}h/day for ${currentStreak} consecutive days. A 30-min break today will boost retention.`;
      insightType  = "warning";
    } else if (nextBadge && nextBadge.daysNeeded === 1) {
      todayInsight = `One session today unlocks the "${nextBadge.name}" badge. Don't break the chain!`;
      insightType  = "achievement";
    } else if (nextBadge && nextBadge.daysNeeded <= 3) {
      todayInsight = `${nextBadge.daysNeeded} more study days to unlock "${nextBadge.name}". Keep the streak alive!`;
      insightType  = "achievement";
    } else if (weeklyChangePercent >= 10) {
      todayInsight = `Study consistency improved ${weeklyChangePercent}% this week. You're building serious momentum!`;
      insightType  = "improvement";
    } else if (weeklyChangePercent <= -15) {
      todayInsight = `Study time dropped ${Math.abs(weeklyChangePercent)}% vs last week. One strong session today can reverse the trend.`;
      insightType  = "suggestion";
    } else if (leastStudiedSubject && totalMinutes > 0) {
      const pct = Math.round((leastStudiedSubject.minutes / totalMinutes) * 100);
      todayInsight = `"${leastStudiedSubject.name}" gets only ${pct}% of your study time. A focused session on it today will improve exam balance.`;
      insightType  = "suggestion";
    } else if (currentStreak >= 3) {
      todayInsight = `${currentStreak}-day streak! You've studied ${totalHours}h total across ${subjectCount} subject${subjectCount === 1 ? "" : "s"}. ${productivityScore >= 70 ? "Excellent work." : "Keep it consistent."}`;
      insightType  = "motivation";
    } else {
      todayInsight = `Log a session today to build your streak. Students who study daily score 34% higher on average.`;
      insightType  = "motivation";
    }

    const result: Analytics = {
      totalHours, totalMinutes, totalSessions, studyDaysCount,
      currentStreak, longestStreak, totalRubies, achievementCount, totalBadges,
      subjectBreakdown: subjectMap, subjectCount, mostStudiedSubject, leastStudiedSubject,
      weeklyTrend, thisWeekMinutes, lastWeekMinutes, weeklyChangePercent, avgDailyMinutes,
      productivityScore, burnoutRisk, burnoutReason, nextBadge,
      todayInsight, insightType,
    };

    return Response.json(result);
  } catch (err) {
    console.error("[GET /api/analytics]", err);
    return Response.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}
