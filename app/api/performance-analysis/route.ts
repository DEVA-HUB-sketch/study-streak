import Groq from "groq-sdk";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import ExamResult from "@/models/ExamResult";
import { getUserFromRequest } from "@/lib/auth";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies } from "@/lib/rubies";
import { BADGES, AchievementStats } from "@/lib/constants";
import { format, subDays } from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface PerformanceAnalysis {
  performanceReport:   string;
  weakSubjects:        { subject: string; analysis: string; recommendation: string }[];
  studyEfficiency:     { subject: string; hoursStudied: number; avgScore: number; insight: string }[];
  examReadiness:       { score: number; predicted: string; confidence: string };
  recommendations:     string[];
  mostImproved:        string;
  consistencyInsight:  string;
  mentorMessage:       string;
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const [sessions, exams] = await Promise.all([
      StudySession.find({ userId: auth.userId }).sort({ date: -1 }).lean(),
      ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).lean(),
    ]);

    /* ── Build analytics context ───────────────────────────── */
    const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
    const totalSessions = sessions.length;
    const { currentStreak, longestStreak } = computeStreaks(sessions.map(s => s.date));
    const totalRubies   = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);

    const achievementStats: AchievementStats = { totalSessions, currentStreak, longestStreak, totalMinutes, totalRubies };
    const achievementCount = BADGES.filter(b => b.condition(achievementStats)).length;

    /* Subject distribution */
    const subjectMap: Record<string, number> = {};
    sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
    const subjectLines = Object.entries(subjectMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, mins]) => `  ${name}: ${+(mins / 60).toFixed(1)}h (${Math.round((mins / totalMinutes) * 100)}%)`)
      .join("\n");

    /* Weekly trend */
    const thisWeek = sessions.filter(s => new Date(s.date) >= subDays(new Date(), 6)).reduce((a, s) => a + s.duration, 0);
    const lastWeek = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= subDays(new Date(), 13) && d < subDays(new Date(), 6);
    }).reduce((a, s) => a + s.duration, 0);
    const weekChange = lastWeek > 0 ? +(((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) : 0;

    /* Exam context */
    const examLines = exams.slice(0, 15).map(e =>
      `  ${e.subject} | ${e.examName} | ${format(new Date(e.examDate), "MMM d yyyy")} | ${e.marksObtained}/${e.totalMarks} (${e.percentage}% ${e.grade}) | study: ${e.studyHoursBeforeExam ?? "?"}h`
    ).join("\n");

    /* Exam by subject - avg score */
    const examBySubject: Record<string, number[]> = {};
    exams.forEach(e => {
      if (!examBySubject[e.subject]) examBySubject[e.subject] = [];
      examBySubject[e.subject].push(e.percentage);
    });
    const examSubjectLines = Object.entries(examBySubject).map(([subj, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return `  ${subj}: avg ${avg}% across ${scores.length} exam(s)`;
    }).join("\n");

    /* Consistency */
    const uniqueDays = new Set(sessions.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size;
    const studyDays90 = sessions.filter(s => new Date(s.date) >= subDays(new Date(), 90)).length > 0
      ? new Set(sessions.filter(s => new Date(s.date) >= subDays(new Date(), 90)).map(s => format(new Date(s.date), "yyyy-MM-dd"))).size
      : 0;
    const consistencyScore = Math.round(
      Math.min(studyDays90 / 90, 1) * 50 +
      Math.min(currentStreak / 30, 1) * 30 +
      Math.min((totalMinutes / totalSessions || 0) / 120, 1) * 20
    );

    /* Custom question from body */
    const body = await request.json().catch(() => ({})) as { question?: string };
    const customQuestion = body.question?.trim();

    const systemPrompt = `You are an expert AI Academic Performance Analyst and Mentor for Indian college students.
Respond ONLY with a valid JSON object — no markdown, no extra text.`;

    const userPrompt = `Analyse this student's complete academic data and generate a comprehensive performance analysis.

STUDY HISTORY:
  Total study hours: ${+(totalMinutes / 60).toFixed(1)}h across ${totalSessions} sessions
  Current streak: ${currentStreak} days | Longest: ${longestStreak} days
  Unique study days: ${uniqueDays} total | ${studyDays90} in last 90 days
  Consistency score: ${consistencyScore}/100
  This week: ${+(thisWeek / 60).toFixed(1)}h vs last week: ${+(lastWeek / 60).toFixed(1)}h (${weekChange >= 0 ? "+" : ""}${weekChange}%)
  Achievements: ${achievementCount}/${BADGES.length} badges

SUBJECT TIME DISTRIBUTION:
${subjectLines || "  No sessions yet"}

EXAM HISTORY (most recent first):
${examLines || "  No exam records yet"}

EXAM PERFORMANCE BY SUBJECT:
${examSubjectLines || "  No exam records yet"}

${customQuestion ? `STUDENT'S SPECIFIC QUESTION:\n"${customQuestion}"\n` : ""}

Return this EXACT JSON structure:
{
  "performanceReport": "<2-3 sentences summarising overall academic trajectory, citing real numbers>",
  "weakSubjects": [
    { "subject": "<name>", "analysis": "<1-2 sentences citing actual % of study time and exam scores>", "recommendation": "<specific action with time/frequency>" }
  ],
  "studyEfficiency": [
    { "subject": "<name>", "hoursStudied": <number>, "avgScore": <number 0-100>, "insight": "<1 sentence on hours vs score efficiency>" }
  ],
  "examReadiness": {
    "score": <integer 0-100 based on real data>,
    "predicted": "<score range like '78-85%'>",
    "confidence": "<Low|Medium|High based on data volume>"
  },
  "recommendations": ["<specific, actionable recommendation 1>", "<rec 2>", "<rec 3>", "<rec 4>", "<rec 5>"],
  "mostImproved": "<subject name or 'Insufficient data'>",
  "consistencyInsight": "<1-2 sentences about study consistency patterns>",
  "mentorMessage": "<${customQuestion ? "direct answer to the student question, 2-3 sentences" : "motivational message referencing their actual streak and hours, 1-2 sentences"}>"
}

RULES:
  - All numbers must reference actual data above
  - weakSubjects: focus on subjects with low exam scores OR very low study time relative to others
  - studyEfficiency: only include subjects that appear in BOTH study history AND exam history
  - If data is insufficient, acknowledge it honestly
  - mentorMessage must be warm, specific, and encouraging`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    const analysis: PerformanceAnalysis = JSON.parse(jsonStr);
    return Response.json({ ...analysis, consistencyScore });
  } catch (err) {
    console.error("[POST /api/performance-analysis]", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "AI returned unexpected format. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
