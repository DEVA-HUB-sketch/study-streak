import Groq from "groq-sdk";
import { connectDB }         from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import StudySession  from "@/models/StudySession";
import ExamResult    from "@/models/ExamResult";
import { computeStreaks } from "@/lib/streaks";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface WeeklyReport {
  weekLabel:        string;
  totalHours:       number;
  totalSessions:    number;
  dailyBreakdown:   { day: string; minutes: number; sessions: number }[];
  subjectBreakdown: { subject: string; hours: number; percentage: number }[];
  currentStreak:    number;
  consistencyScore: number;
  focusScore:       number;
  burnoutTrend:     "Safe" | "Caution" | "High";
  weakSubjects:     string[];
  strongSubjects:   string[];
  examPrediction:   string;
  improvements:     string[];
  achievements:     string[];
  aiSummary:        string;
  nextWeekGoals:    string[];
  motivationClose:  string;
}

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 });
    const prevStart = subDays(weekStart, 7);

    /* Fetch all sessions (for accurate streak) + exams */
    const [allSessions, exams] = await Promise.all([
      StudySession.find({ userId: auth.userId }).sort({ date: -1 }).lean(),
      ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).limit(15).lean(),
    ]);

    const thisWeekSessions = allSessions.filter(s =>
      new Date(s.date) >= weekStart && new Date(s.date) <= weekEnd
    );
    const lastWeekSessions = allSessions.filter(s => {
      const d = new Date(s.date);
      return d >= prevStart && d < weekStart;
    });

    const totalMinutes   = thisWeekSessions.reduce((a, s) => a + s.duration, 0);
    const lastWeekMinutes = lastWeekSessions.reduce((a, s) => a + s.duration, 0);
    const { currentStreak } = computeStreaks(allSessions.map(s => s.date));

    /* Daily breakdown (Mon–Sun) */
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyBreakdown = days.map((day, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStr  = format(dayDate, "yyyy-MM-dd");
      const daySess = thisWeekSessions.filter(s =>
        format(new Date(s.date), "yyyy-MM-dd") === dayStr
      );
      return { day, minutes: daySess.reduce((a, s) => a + s.duration, 0), sessions: daySess.length };
    });

    /* Subject breakdown */
    const subMap: Record<string, number> = {};
    thisWeekSessions.forEach(s => { subMap[s.subject] = (subMap[s.subject] ?? 0) + s.duration; });
    const subjectBreakdown = Object.entries(subMap)
      .sort((a, b) => b[1] - a[1])
      .map(([subject, mins]) => ({
        subject,
        hours:      +(mins / 60).toFixed(1),
        percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
      }));

    /* Scores */
    const studyDays      = dailyBreakdown.filter(d => d.minutes > 0).length;
    const consistencyScore = Math.round((studyDays / 7) * 100);
    const avgSession     = thisWeekSessions.length > 0 ? totalMinutes / thisWeekSessions.length : 0;
    const focusScore     = Math.min(100, Math.round((avgSession / 45) * 50 + consistencyScore * 0.5));
    const avgMinutes     = totalMinutes / Math.max(studyDays, 1);
    const burnoutTrend: WeeklyReport["burnoutTrend"] =
      currentStreak >= 14 && avgMinutes >= 300 ? "High" :
      currentStreak >= 7  && avgMinutes >= 240 ? "Caution" : "Safe";

    /* Exam performance */
    const examBySubject: Record<string, number[]> = {};
    exams.forEach(e => {
      if (!examBySubject[e.subject]) examBySubject[e.subject] = [];
      examBySubject[e.subject].push(e.percentage);
    });
    const weakSubjects   = Object.entries(examBySubject)
      .filter(([, s]) => s.reduce((a, b) => a + b, 0) / s.length < 60)
      .map(([n]) => n);
    const strongSubjects = Object.entries(examBySubject)
      .filter(([, s]) => s.reduce((a, b) => a + b, 0) / s.length >= 75)
      .map(([n]) => n);

    const weekChange = lastWeekMinutes > 0
      ? +(((totalMinutes - lastWeekMinutes) / lastWeekMinutes) * 100).toFixed(1)
      : 0;

    const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

    /* ── Skip Groq if no study data this week ─────────────────── */
    if (thisWeekSessions.length === 0) {
      const report: WeeklyReport = {
        weekLabel,
        totalHours:      0,
        totalSessions:   0,
        dailyBreakdown,
        subjectBreakdown: [],
        currentStreak,
        consistencyScore: 0,
        focusScore:       0,
        burnoutTrend:    "Safe",
        weakSubjects,
        strongSubjects,
        aiSummary:       `No study sessions were recorded this week (${weekLabel}). ${allSessions.length > 0 ? `You have ${allSessions.length} total sessions from previous weeks — great foundation!` : "Start logging sessions on the Dashboard to see your weekly analysis here."}`,
        examPrediction:  allSessions.length === 0 ? "Start studying to get exam predictions." : "Insufficient weekly data for a prediction — try to study at least 3 days this week.",
        improvements:    ["Log at least one study session today to start your weekly streak", "Set a daily study goal using the dashboard timer", "Try the Pomodoro timer for focused 25-minute sessions"],
        achievements:    allSessions.length > 0 ? [`You have ${allSessions.length} total sessions logged overall`] : [],
        nextWeekGoals:   ["Study at least 5 days next week", "Log 2+ sessions per subject", "Complete one daily challenge each day"],
        motivationClose: "Every expert was once a beginner — log your first session today! 🚀",
      };
      return Response.json(report);
    }

    /* ── Groq AI analysis (only when there is data) ─────────── */
    const subjectsText = subjectBreakdown.map(s => `${s.subject}(${s.hours}h)`).join(", ");
    const dailyText    = dailyBreakdown.map(d => `${d.day}:${d.minutes}min`).join(", ");

    const prompt = `Analyse this student's weekly study data and generate structured insights.

WEEK: ${weekLabel}
Total: ${+(totalMinutes/60).toFixed(1)}h across ${thisWeekSessions.length} sessions
Daily pattern: ${dailyText}
Subjects this week: ${subjectsText}
Consistency: ${consistencyScore}/100 (studied ${studyDays}/7 days)
Focus score: ${focusScore}/100
Burnout trend: ${burnoutTrend}
vs last week: ${weekChange >= 0 ? "+" : ""}${weekChange}%
Current streak: ${currentStreak} days
Weak subjects (from exam history): ${weakSubjects.join(", ") || "none identified"}
Strong subjects: ${strongSubjects.join(", ") || "none identified"}
All-time sessions: ${allSessions.length}

Return ONLY this JSON (no markdown, no extra text):
{
  "aiSummary": "<3-4 sentences honest assessment of this week, cite specific numbers and subjects>",
  "examPrediction": "<prediction based on consistency, study hours, and weak subjects>",
  "improvements": ["<specific improvement 1>", "<improvement 2>", "<improvement 3>"],
  "achievements": ["<something that went well this week>", "<another achievement>"],
  "nextWeekGoals": ["<concrete goal 1>", "<goal 2>", "<goal 3>"],
  "motivationClose": "<1 sentence warm personalised encouragement>"
}`;

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [
        { role: "system", content: "You are an academic performance analyst. Respond ONLY with valid JSON, no markdown fences." },
        { role: "user",   content: prompt },
      ],
      temperature: 0.6,
      max_tokens:  800,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    /* Safe parse — fall back to sensible defaults if Groq returns bad JSON */
    let aiData: Partial<WeeklyReport> = {};
    try {
      aiData = JSON.parse(jsonStr);
    } catch {
      console.warn("[weekly-report] Groq returned non-JSON, using fallback");
      aiData = {
        aiSummary:       `You studied ${+(totalMinutes/60).toFixed(1)}h across ${thisWeekSessions.length} sessions this week across ${subjectBreakdown.length} subject${subjectBreakdown.length !== 1 ? "s" : ""}.`,
        examPrediction:  consistencyScore >= 60 ? "On track for good performance if this consistency is maintained." : "More consistent study sessions needed for reliable exam predictions.",
        improvements:    ["Keep a regular daily study schedule", "Review your weakest subject first each day"],
        achievements:    [`Studied ${studyDays} day${studyDays !== 1 ? "s" : ""} this week`],
        nextWeekGoals:   ["Study every day next week", "Add at least one exam record", "Aim for 2h/day minimum"],
        motivationClose: "Keep going — every session counts!",
      };
    }

    const report: WeeklyReport = {
      weekLabel,
      totalHours:      +(totalMinutes / 60).toFixed(1),
      totalSessions:   thisWeekSessions.length,
      dailyBreakdown,
      subjectBreakdown,
      currentStreak,
      consistencyScore,
      focusScore,
      burnoutTrend,
      weakSubjects,
      strongSubjects,
      aiSummary:       aiData.aiSummary       ?? "",
      examPrediction:  aiData.examPrediction  ?? "",
      improvements:    aiData.improvements    ?? [],
      achievements:    aiData.achievements    ?? [],
      nextWeekGoals:   aiData.nextWeekGoals   ?? [],
      motivationClose: aiData.motivationClose ?? "",
    };

    return Response.json(report);

  } catch (err) {
    console.error("[GET /api/weekly-report]", err);
    return Response.json({ error: "Report generation failed. Please try again." }, { status: 500 });
  }
}
