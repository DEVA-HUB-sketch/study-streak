import Groq from "groq-sdk";
import { connectDB }         from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import StudySession  from "@/models/StudySession";
import ExamResult    from "@/models/ExamResult";
import User          from "@/models/User";
import Subject       from "@/models/Subject";
import AgentMemory   from "@/models/AgentMemory";
import AgentState    from "@/models/AgentState";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies }  from "@/lib/rubies";
import { BADGES, AchievementStats } from "@/lib/constants";
import { format, subDays, isToday } from "date-fns";

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

    /* ── Fetch everything in parallel ─────────────────────────── */
    const [sessions, exams, userDoc, dbSubjects, memory, agentState] = await Promise.all([
      StudySession.find({ userId: auth.userId }).sort({ date: -1 }).lean(),
      ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).lean(),
      User.findById(auth.userId)
        .select("name college department academicYear targetCGPA preferredStudyHours examTarget goals")
        .lean(),
      Subject.find({ userId: auth.userId }).lean(),
      AgentMemory.findOne({ userId: auth.userId }).lean(),
      AgentState.findOne({ userId: auth.userId }).lean(),
    ]);

    /* ── Analytics ────────────────────────────────────────────── */
    const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
    const totalSessions = sessions.length;
    const { currentStreak, longestStreak } = computeStreaks(sessions.map(s => s.date));
    const totalRubies   = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);
    const achieveStats: AchievementStats = { totalSessions, currentStreak, longestStreak, totalMinutes, totalRubies };
    const achievementCount = BADGES.filter(b => b.condition(achieveStats)).length;

    /* ── Most recent session (CRITICAL — the AI MUST use this) ── */
    const latestSession = sessions[0] ?? null;
    const latestSessionLine = latestSession
      ? `${latestSession.subject} — ${latestSession.duration}min on ${format(new Date(latestSession.date), "EEEE, MMM d yyyy")} at ${format(new Date(latestSession.date), "h:mm a")}${latestSession.notes ? ` (notes: "${latestSession.notes}")` : ""}`
      : "No sessions recorded yet";

    /* ── Today's sessions in chronological order ─────────────── */
    const todaySessions = sessions.filter(s => isToday(new Date(s.date)));
    const todayMinutes  = todaySessions.reduce((a, s) => a + s.duration, 0);
    const todayLines = todaySessions.length > 0
      ? todaySessions
          .map(s => `  ${format(new Date(s.date), "h:mm a")} — ${s.subject} ${s.duration}min${s.notes ? ` (${s.notes})` : ""}`)
          .join("\n")
      : "  No sessions logged today yet";

    /* ── Last 10 sessions (most recent first with exact timestamps) */
    const recentSessionLines = sessions.slice(0, 10)
      .map((s, i) => `  ${i === 0 ? "► " : "  "}${i + 1}. ${s.subject} — ${s.duration}min — ${format(new Date(s.date), "MMM d, h:mm a")}${i === 0 ? " ← MOST RECENT" : ""}`)
      .join("\n") || "  No sessions yet";

    /* ── Subject totals ──────────────────────────────────────── */
    const subjectMap: Record<string, number> = {};
    sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
    const subjectLines = Object.entries(subjectMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, mins]) => `  ${name}: ${+(mins / 60).toFixed(1)}h (${Math.round((mins / totalMinutes) * 100)}%)`)
      .join("\n") || "  No sessions yet";

    /* ── Weekly trend ────────────────────────────────────────── */
    const thisWeek = sessions.filter(s => new Date(s.date) >= subDays(new Date(), 6)).reduce((a, s) => a + s.duration, 0);
    const lastWeek = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= subDays(new Date(), 13) && d < subDays(new Date(), 6);
    }).reduce((a, s) => a + s.duration, 0);
    const weekChange = lastWeek > 0 ? +(((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) : 0;

    /* ── Exam data ───────────────────────────────────────────── */
    const examLines = exams.slice(0, 15).map(e =>
      `  ${e.subject} | ${e.examName} | ${e.examDate} | ${e.marksObtained}/${e.totalMarks} (${e.percentage}% ${e.grade})`
    ).join("\n") || "  No exam records yet";

    const examBySubject: Record<string, number[]> = {};
    exams.forEach(e => {
      if (!examBySubject[e.subject]) examBySubject[e.subject] = [];
      examBySubject[e.subject].push(e.percentage);
    });
    const examSubjectLines = Object.entries(examBySubject).map(([subj, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return `  ${subj}: avg ${avg}% across ${scores.length} exam(s)`;
    }).join("\n") || "  No exam records yet";

    /* ── Consistency score ───────────────────────────────────── */
    const uniqueDays = new Set(sessions.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size;
    const studyDays90 = sessions.filter(s => new Date(s.date) >= subDays(new Date(), 90)).length > 0
      ? new Set(sessions.filter(s => new Date(s.date) >= subDays(new Date(), 90)).map(s => format(new Date(s.date), "yyyy-MM-dd"))).size
      : 0;
    const consistencyScore = Math.round(
      Math.min(studyDays90 / 90, 1) * 50 +
      Math.min(currentStreak / 30, 1) * 30 +
      Math.min((totalMinutes / totalSessions || 0) / 120, 1) * 20
    );

    /* ── Custom question ─────────────────────────────────────── */
    const body = await request.json().catch(() => ({})) as { question?: string };
    const customQuestion = body.question?.trim();

    /* ── Build the comprehensive real-time prompt ─────────────── */
    const nowStr = format(new Date(), "EEEE, MMMM d yyyy 'at' h:mm a");

    const systemPrompt = `You are an expert AI Academic Mentor for Indian college students.
You have LIVE, real-time access to this student's study database — data was fetched RIGHT NOW at ${nowStr}.
Respond ONLY with a valid JSON object — no markdown fences, no extra text.

CRITICAL RULES — breaking these is a factual error:
1. The MOST RECENTLY STUDIED SUBJECT is shown under "MOST RECENT SESSION" — never say a different subject was studied last.
2. Do NOT infer recency from cumulative totals. A subject with the most total hours is NOT necessarily the most recently studied.
3. Always use the student's actual name (${userDoc?.name ?? "Student"}) in the mentorMessage.
4. Today's date is ${nowStr} — use this as the reference point for "today", "this week", etc.
5. "What subject did I study last?" → the answer is the MOST RECENT SESSION subject above. State it factually.`;

    const userPrompt = `
════════════════════════════════════════════
STUDENT PROFILE
════════════════════════════════════════════
Name:       ${userDoc?.name ?? "Student"}
College:    ${(userDoc as {college?:string})?.college ?? "—"}
Department: ${(userDoc as {department?:string})?.department ?? "—"}
Year:       ${(userDoc as {academicYear?:string})?.academicYear ?? "—"}
Target CGPA:${(userDoc as {targetCGPA?:number})?.targetCGPA ?? "not set"}
Exam goal:  ${(userDoc as {examTarget?:string})?.examTarget ?? "not set"}
Subjects library: ${dbSubjects.map(s => s.name).join(", ") || "none saved"}

════════════════════════════════════════════
REAL-TIME SESSION DATA (fetched live from MongoDB at ${nowStr})
════════════════════════════════════════════

▶ MOST RECENT SESSION (use THIS to answer "what did I study last?"):
  ${latestSessionLine}

▶ TODAY'S SESSIONS (${format(new Date(), "MMM d, yyyy")}):
  Total today: ${todayMinutes}min across ${todaySessions.length} session${todaySessions.length !== 1 ? "s" : ""}
${todayLines}

▶ LAST 10 SESSIONS (newest first with exact times):
${recentSessionLines}

▶ OVERALL STATS:
  Total: ${+(totalMinutes / 60).toFixed(1)}h across ${totalSessions} sessions
  Streak: ${currentStreak} days current | ${longestStreak} days best
  This week: ${+(thisWeek / 60).toFixed(1)}h vs last week: ${+(lastWeek / 60).toFixed(1)}h (${weekChange >= 0 ? "+" : ""}${weekChange}%)
  Unique study days: ${uniqueDays} | Consistency score: ${consistencyScore}/100
  Achievements: ${achievementCount}/${BADGES.length} badges | Rubies: ${totalRubies}

▶ SUBJECT TIME DISTRIBUTION (ALL TIME — this is cumulative, NOT recency):
${subjectLines}

════════════════════════════════════════════
AI AGENT MEMORY (learned patterns)
════════════════════════════════════════════
  Weak subjects (AI-identified): ${memory?.weakSubjects?.join(", ") || "none identified yet"}
  Strong subjects (AI-identified): ${memory?.strongSubjects?.join(", ") || "none identified yet"}
  Learning style: ${memory?.learningStyle ?? "not determined"}
  Study pattern: ${memory?.consistencyPattern ?? "insufficient data"}
  Active goals: ${memory?.activeGoals?.filter(g => !g.completed).map(g => g.description).join("; ") || "none"}
  ${agentState ? `Current risk: ${agentState.riskLevel} | Burnout: ${agentState.burnoutLevel} | Agent status: ${agentState.agentStatus}` : ""}
  ${agentState?.mission ? `Today's AI mission: ${agentState.mission}` : ""}

════════════════════════════════════════════
EXAM PERFORMANCE
════════════════════════════════════════════
${examLines}

EXAM AVERAGES BY SUBJECT:
${examSubjectLines}

${customQuestion ? `════════════════════════════════════════════\nSTUDENT'S QUESTION:\n"${customQuestion}"\n════════════════════════════════════════════\n` : ""}

Return this EXACT JSON:
{
  "performanceReport": "<2-3 sentences summarising academic trajectory with real numbers. Reference the most recent session subject correctly>",
  "weakSubjects": [
    { "subject": "<name>", "analysis": "<cite actual study time % and exam scores>", "recommendation": "<specific action>" }
  ],
  "studyEfficiency": [
    { "subject": "<name>", "hoursStudied": <number>, "avgScore": <0-100>, "insight": "<hours vs score relationship>" }
  ],
  "examReadiness": {
    "score": <0-100 based on real data>,
    "predicted": "<score range>",
    "confidence": "<Low|Medium|High>"
  },
  "recommendations": ["<specific actionable recommendation citing real data>"],
  "mostImproved": "<subject or 'Insufficient data'>",
  "consistencyInsight": "<1-2 sentences on study consistency>",
  "mentorMessage": "<${customQuestion
    ? `Direct answer to: "${customQuestion}" — be specific, use real data from above. If they ask what they studied last, say EXACTLY what the MOST RECENT SESSION shows`
    : `Personalised message to ${userDoc?.name?.split(" ")[0] ?? "the student"} referencing their actual most recent session (${latestSession?.subject ?? "none"}) and real streak/hours`
  }>"
}

REMINDER: The most recently studied subject is "${latestSession?.subject ?? "none"}" — cite this accurately in mentorMessage and performanceReport.`;

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens:  2048,
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
