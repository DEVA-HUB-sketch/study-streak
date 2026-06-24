import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies } from "@/lib/rubies";
import { BADGES, AchievementStats } from "@/lib/constants";
import { format, subDays } from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AIStudyPlan {
  examReadinessScore:       number;
  motivationMessage:        string;
  studyStrategy:            string;
  dailyTargets:             string[];
  timetable:                { slot: string; subject: string; activity: string; duration: string }[];
  subjectMethods:           { subject: string; priority: string; methods: string[]; tip: string }[];
  weeklyRoadmap:            { week: string; theme: string; goals: string[] }[];
  resources:                { subject: string; items: string[] }[];
  /* NEW — real-data analysis */
  weakSubjectAnalysis:      string;
  strengthAnalysis:         string;
  burnoutStatus:            string;
  productivityInsight:      string;
  personalizedRecommendations: string[];
}

/* ── Fetch real study analytics for the user ─────────────── */
async function fetchUserAnalytics(userId: string) {
  const sessions = await StudySession.find({ userId }).sort({ date: -1 }).lean();

  if (sessions.length === 0) return null;

  const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
  const totalSessions = sessions.length;

  const { currentStreak, longestStreak } = computeStreaks(sessions.map(s => s.date));
  const totalRubies = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);

  const achievementStats: AchievementStats = { totalSessions, currentStreak, longestStreak, totalMinutes, totalRubies };
  const achievementCount = BADGES.filter(b => b.condition(achievementStats)).length;

  /* Subject time distribution */
  const subjectMap: Record<string, { minutes: number; sessions: number }> = {};
  sessions.forEach(s => {
    if (!subjectMap[s.subject]) subjectMap[s.subject] = { minutes: 0, sessions: 0 };
    subjectMap[s.subject].minutes  += s.duration;
    subjectMap[s.subject].sessions += 1;
  });

  const sorted = Object.entries(subjectMap).sort((a, b) => b[1].minutes - a[1].minutes);
  const mostStudied  = sorted[0];
  const leastStudied = sorted[sorted.length - 1];

  /* Last 7 days summary */
  const weekStart = subDays(new Date(), 6);
  const recentSessions = sessions.filter(s => new Date(s.date) >= weekStart);
  const thisWeekMinutes = recentSessions.reduce((a, s) => a + s.duration, 0);

  const prevWeekStart = subDays(new Date(), 13);
  const lastWeekMinutes = sessions
    .filter(s => { const d = new Date(s.date); return d >= prevWeekStart && d < weekStart; })
    .reduce((a, s) => a + s.duration, 0);

  const weeklyChange = lastWeekMinutes > 0
    ? +(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100).toFixed(1)
    : 0;

  /* Unique study days */
  const uniqueDays = new Set(sessions.map(s => format(new Date(s.date), "yyyy-MM-dd")));
  const avgDailyMinutes = uniqueDays.size > 0 ? Math.round(totalMinutes / uniqueDays.size) : 0;

  /* Recent sessions plain text (last 10) */
  const recentText = sessions.slice(0, 10)
    .map(s => `  - ${format(new Date(s.date), "MMM dd")}: ${s.subject} (${s.duration}min)`)
    .join("\n");

  /* Subject distribution text */
  const distText = sorted
    .map(([name, stat]) => {
      const pct = totalMinutes > 0 ? Math.round((stat.minutes / totalMinutes) * 100) : 0;
      return `  - ${name}: ${+(stat.minutes / 60).toFixed(1)}h (${pct}% of total, ${stat.sessions} sessions)`;
    })
    .join("\n");

  return {
    totalHours:      +(totalMinutes / 60).toFixed(1),
    totalSessions,
    currentStreak,
    longestStreak,
    totalRubies,
    achievementCount,
    avgDailyMinutes,
    thisWeekMinutes,
    lastWeekMinutes,
    weeklyChange,
    burnoutRisk:     currentStreak >= 7 && avgDailyMinutes >= 240,
    mostStudied:     mostStudied  ? { name: mostStudied[0],  hours: +(mostStudied[1].minutes  / 60).toFixed(1) } : null,
    leastStudied:    leastStudied ? { name: leastStudied[0], hours: +(leastStudied[1].minutes / 60).toFixed(1) } : null,
    recentText,
    distText,
  };
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, course, year, subjects, weakSubjects, strongSubjects, examDate, studyHours } = body;

    if (!course?.trim() || !subjects?.trim() || !examDate || !studyHours) {
      return Response.json({ error: "Course, subjects, exam date and study hours are required." }, { status: 400 });
    }

    await connectDB();

    /* ── Fetch real data from MongoDB ────────────────────── */
    const [analytics, userDoc] = await Promise.all([
      fetchUserAnalytics(auth.userId),
      User.findById(auth.userId).lean(),
    ]);

    const daysLeft    = Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000));
    const weeksCount  = Math.min(4, Math.ceil(daysLeft / 7));

    /* ── Build real-data context block ───────────────────── */
    const dataBlock = analytics
      ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REAL STUDY HISTORY FROM MONGODB (use this to personalise everything):
  Total studied: ${analytics.totalHours}h across ${analytics.totalSessions} sessions
  Current streak: ${analytics.currentStreak} days  |  Longest ever: ${analytics.longestStreak} days
  This week: ${(analytics.thisWeekMinutes / 60).toFixed(1)}h  |  Last week: ${(analytics.lastWeekMinutes / 60).toFixed(1)}h  |  Change: ${analytics.weeklyChange >= 0 ? "+" : ""}${analytics.weeklyChange}%
  Average daily study: ${analytics.avgDailyMinutes} min
  Achievements: ${analytics.achievementCount}/${BADGES.length} badges  |  Rubies: ${analytics.totalRubies}
  Burnout risk: ${analytics.burnoutRisk ? `YES — ${analytics.currentStreak} consecutive days averaging ${analytics.avgDailyMinutes}min` : "No"}

Subject time distribution (actual from DB):
${analytics.distText}

Most studied: ${analytics.mostStudied ? `${analytics.mostStudied.name} (${analytics.mostStudied.hours}h)` : "None yet"}
Least studied: ${analytics.leastStudied ? `${analytics.leastStudied.name} (${analytics.leastStudied.hours}h)` : "N/A"}

Recent sessions:
${analytics.recentText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use this REAL DATA to:
1. Identify true weak subjects by time distribution (not just student's claim)
2. Spot burnout risk and recommend adjustments if present
3. Calibrate examReadinessScore based on actual study pace vs days remaining
4. Make "weakSubjectAnalysis" and "strengthAnalysis" data-driven, not generic
`
      : `\nNo prior study history found — treat this as a fresh start.\n`;

    const systemPrompt = `You are an expert AI Performance Coach powered by real MongoDB study data.
Respond ONLY with a single valid JSON object — no markdown fences, no extra text.`;

    const userPrompt = `Analyse this student's REAL study history and generate a comprehensive, data-driven study plan.

STUDENT PROFILE
  Name: ${name || userDoc?.name || "Student"}
  Course: ${course}
  Year: ${year || "Not specified"}
  All Subjects: ${subjects}
  Self-reported Weak Subjects: ${weakSubjects || "None specified"}
  Self-reported Strong Subjects: ${strongSubjects || "None specified"}
  Exam Date: ${examDate} (${daysLeft} days away)
  Daily Study Hours Available: ${studyHours}
${dataBlock}

Return a JSON object with EXACTLY these keys:

{
  "examReadinessScore": <integer 0-100, calibrated against real pace and days left>,
  "motivationMessage": "<2-3 personalized sentences referencing actual streak/hours>",
  "studyStrategy": "<3-4 sentences addressing real patterns from study history>",
  "dailyTargets": ["<specific actionable target>", "<target>", "<target>", "<target>", "<target>"],
  "timetable": [
    { "slot": "<HH:MM AM/PM – HH:MM AM/PM>", "subject": "<subject>", "activity": "<specific task>", "duration": "<N min>" }
  ],
  "subjectMethods": [
    { "subject": "<name>", "priority": "<High|Medium|Low>", "methods": ["<method 1>", "<method 2>", "<method 3>"], "tip": "<one concrete tip>" }
  ],
  "weeklyRoadmap": [
    { "week": "Week N", "theme": "<focus theme>", "goals": ["<goal 1>", "<goal 2>", "<goal 3>"] }
  ],
  "resources": [
    { "subject": "<name>", "items": ["<resource>", "<resource>", "<resource>"] }
  ],
  "weakSubjectAnalysis": "<2-3 sentences identifying weak subjects from ACTUAL time distribution data, comparing to self-report>",
  "strengthAnalysis": "<2-3 sentences on genuine strengths evidenced by actual study data>",
  "burnoutStatus": "<1-2 sentences assessing burnout risk from real streak and avg daily hours; say 'No burnout risk' if safe>",
  "productivityInsight": "<2 sentences on study efficiency: sessions per week, avg duration, consistency score>",
  "personalizedRecommendations": ["<data-driven recommendation 1>", "<recommendation 2>", "<recommendation 3>", "<recommendation 4>"]
}

RULES:
  - timetable: exactly ${Number(studyHours) <= 4 ? 4 : 6} slots covering ${studyHours}h; include a 15min break slot
  - subjectMethods: one entry for EVERY subject in the list
  - weeklyRoadmap: exactly ${weeksCount} entries
  - resources: focus on lowest-time subjects first
  - personalizedRecommendations: each must reference specific data (e.g., actual subject names, streak number, hours)
  - Never say "based on your self-report" — use actual DB data`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    const data: AIStudyPlan = JSON.parse(jsonStr);
    return Response.json(data);
  } catch (err) {
    console.error("[POST /api/ai]", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "AI returned an unexpected format. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "AI service error. Please try again." }, { status: 500 });
  }
}
