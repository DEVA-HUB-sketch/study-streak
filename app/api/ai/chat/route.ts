import Groq from "groq-sdk";
import { connectDB }         from "@/lib/mongodb";
import StudySession  from "@/models/StudySession";
import ExamResult    from "@/models/ExamResult";
import Subject       from "@/models/Subject";
import User          from "@/models/User";
import AgentMemory   from "@/models/AgentMemory";
import { getUserFromRequest } from "@/lib/auth";
import { computeStreaks }     from "@/lib/streaks";
import { format, subDays }    from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { messages, course: formCourse, subjects: formSubjects } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    await connectDB();

    /* ── Fetch everything from MongoDB ────────────────────────── */
    const [sessions, memory, userDoc, dbSubjects, exams] = await Promise.all([
      StudySession.find({ userId: auth.userId }).sort({ date: -1 }).limit(60).lean(),
      AgentMemory.findOne({ userId: auth.userId }).lean(),
      User.findById(auth.userId)
        .select("name college department academicYear targetCGPA preferredStudyHours examTarget goals")
        .lean(),
      Subject.find({ userId: auth.userId }).lean(),
      ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).limit(10).lean(),
    ]);

    /* ── Identity ─────────────────────────────────────────────── */
    const firstName    = (userDoc?.name ?? "Student").split(" ")[0];
    const fullName     = userDoc?.name ?? "Student";
    const college      = (userDoc as { college?: string })?.college ?? "";
    const department   = (userDoc as { department?: string })?.department ?? "";
    const academicYear = (userDoc as { academicYear?: string })?.academicYear ?? "";
    const targetCGPA   = (userDoc as { targetCGPA?: number })?.targetCGPA ?? null;
    const examTarget   = (userDoc as { examTarget?: string })?.examTarget ?? "";
    const userGoals    = (userDoc as { goals?: string })?.goals ?? "";
    const prefHours    = (userDoc as { preferredStudyHours?: number })?.preferredStudyHours ?? 2;

    const subjectList  = dbSubjects.length > 0
      ? dbSubjects.map(s => s.name).join(", ")
      : (formSubjects || "Not specified");
    const courseCtx    = formCourse || department || "Not specified";
    const nowStr       = format(new Date(), "EEEE, MMMM d yyyy 'at' h:mm a");

    /* ── Build study data block ───────────────────────────────── */
    let dataBlock = "";

    if (sessions.length > 0) {
      const totalMinutes = sessions.reduce((a, s) => a + s.duration, 0);
      const { currentStreak, longestStreak } = computeStreaks(sessions.map(s => s.date));

      /* Most recent session — the single most important fact for "what did I study last?" */
      const latest = sessions[0];
      const latestDateStr = format(new Date(latest.date), "EEEE, MMMM d yyyy");

      /* Today's sessions */
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todaySessions = sessions.filter(s =>
        format(new Date(s.date), "yyyy-MM-dd") === todayStr
      );
      const todayMins = todaySessions.reduce((a, s) => a + s.duration, 0);
      const plannedMins = Math.round(prefHours * 60);

      const todayDetail = todaySessions.length > 0
        ? todaySessions.map(s => `    • ${s.subject} — ${s.duration}min${s.notes ? ` (${s.notes})` : ""}`).join("\n")
        : "    • No sessions logged today yet";

      /* Last 10 sessions listed explicitly */
      const recentList = sessions.slice(0, 10)
        .map((s, i) => `  ${i + 1}. ${s.subject} — ${s.duration}min on ${format(new Date(s.date), "MMM d, yyyy")}${s.notes ? ` — "${s.notes}"` : ""}`)
        .join("\n");

      /* Subject totals */
      const subjectMap: Record<string, number> = {};
      sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
      const sorted = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
      const subjectBreakdown = sorted.map(([name, mins]) => {
        const pct = Math.round((mins / totalMinutes) * 100);
        return `  ${name}: ${+(mins/60).toFixed(1)}h total (${pct}% of all study time)`;
      }).join("\n");

      const thisWeekMins = sessions
        .filter(s => new Date(s.date) >= subDays(new Date(), 6))
        .reduce((a, s) => a + s.duration, 0);
      const uniqueDays = new Set(sessions.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size;
      const avgDaily   = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;
      const burnout    = currentStreak >= 7 && avgDaily >= 240;

      dataBlock = `
══════════════════════════════════════════════════
LIVE DATABASE SNAPSHOT — fetched right now (${nowStr})
This is ${fullName}'s actual study record. Answer every question using ONLY this data.
══════════════════════════════════════════════════

STUDENT: ${fullName}
  College: ${college}${department ? ` | ${department}` : ""}${academicYear ? ` | ${academicYear}` : ""}
  Course: ${courseCtx} | Subjects: ${subjectList}
  Target CGPA: ${targetCGPA ?? "not set"}${examTarget ? ` | Exam goal: ${examTarget}` : ""}

▶ MOST RECENT STUDY SESSION (answer "what did I study last?" from this):
  Subject: ${latest.subject}
  Date: ${latestDateStr}
  Duration: ${latest.duration} minutes
  Notes: ${latest.notes || "none"}

▶ TODAY — ${format(new Date(), "EEEE, MMMM d")}:
  Studied: ${todayMins}min out of ${plannedMins}min planned (${Math.round((todayMins/Math.max(plannedMins,1))*100)}% of daily goal)
${todayDetail}

▶ LAST 10 SESSIONS (most recent first):
${recentList}

▶ OVERALL STATS:
  Total: ${+(totalMinutes/60).toFixed(1)}h across ${sessions.length} sessions
  Current streak: ${currentStreak} days | Best streak: ${longestStreak} days
  This week: ${+(thisWeekMins/60).toFixed(1)}h | Daily average: ${avgDaily}min
  Burnout risk: ${burnout ? `YES — ${currentStreak} consecutive days, avg ${avgDaily}min/day` : "No"}

▶ SUBJECT TIME BREAKDOWN:
${subjectBreakdown}`;

    } else {
      dataBlock = `
══════════════════════════════════════════════════
LIVE DATABASE SNAPSHOT — fetched right now (${nowStr})
══════════════════════════════════════════════════
STUDENT: ${fullName} | ${college}${department ? ` | ${department}` : ""}
STATUS: No study sessions recorded yet. This is a fresh start.
Encourage ${firstName} to log their first session on the Dashboard.`;
    }

    /* ── Exam performance block ───────────────────────────────── */
    let examBlock = "";
    if (exams.length > 0) {
      const bySubject: Record<string, number[]> = {};
      exams.forEach(e => {
        if (!bySubject[e.subject]) bySubject[e.subject] = [];
        bySubject[e.subject].push(e.percentage);
      });

      const avgLines = Object.entries(bySubject).map(([subj, scores]) => {
        const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
        return `  ${subj}: avg ${avg}% (${scores.length} exam${scores.length>1?"s":""})`;
      }).join("\n");

      const recentExams = exams.slice(0, 5)
        .map(e => `  • ${e.subject} — ${e.examName}: ${e.percentage}% (${e.grade}) on ${e.examDate}`)
        .join("\n");

      examBlock = `
▶ EXAM RECORDS:
  Recent:
${recentExams}
  Per-subject averages:
${avgLines}`;
    }

    /* ── Agent memory block ───────────────────────────────────── */
    let memBlock = "";
    if (memory) {
      const goals = memory.activeGoals?.filter(g=>!g.completed).map(g=>g.description).join("; ") || "none";
      memBlock = `
▶ AI MEMORY (learned from past behaviour):
  Preferred study time: ${memory.preferredStudyTime}
  Learning style: ${memory.learningStyle}
  Weak subjects (AI-identified): ${memory.weakSubjects.join(", ") || "none yet"}
  Strong subjects (AI-identified): ${memory.strongSubjects.join(", ") || "none yet"}
  Consistency pattern: ${memory.consistencyPattern}
  Active goals: ${goals}`;
    }

    /* ── System prompt ────────────────────────────────────────── */
    const systemPrompt =
`You are Study Buddy — ${firstName}'s personal AI academic coach inside Study Streak.
You have LIVE access to ${firstName}'s database, fetched RIGHT NOW before this message.
${dataBlock}
${examBlock}
${memBlock}
${userGoals ? `\n▶ STUDENT'S GOALS: ${userGoals}` : ""}

════════════════════════════════
IDENTITY & BEHAVIOUR RULES
════════════════════════════════
You are Study Buddy. You are NOT Llama. You are NOT a general-purpose AI.
You are a real-time academic coach with a live database connection.

ABSOLUTE RULES — violating these is wrong:
1. NEVER say "I don't have real-time access to your data." You DO. It's shown above.
2. NEVER say "I can't see your current session." You CAN — it's listed under LAST 10 SESSIONS.
3. NEVER say "I only have your overall data." You have individual sessions with dates and subjects.
4. NEVER say "I don't have information on what you studied last." The MOST RECENT SESSION is written above.
5. If you don't know something that's NOT in the data, say so honestly — but never fake ignorance about what IS in the data above.

HOW TO ANSWER:
- "What subject did I study last?" → Look at ▶ MOST RECENT STUDY SESSION and answer directly.
- "What did I study today?" → Look at ▶ TODAY section and list all sessions.
- "How am I doing?" → Use streak, hours, today's progress, exam averages. Be specific with numbers.
- "Which subject should I focus on?" → Compare study time vs exam scores. Name the subject.
- "Am I on track?" → Compare today's minutes to planned minutes. Give a specific verdict.
- For academic questions (explain concepts, solve problems, help with topics): answer fully and accurately.
- Always use ${firstName}'s first name naturally.
- Be warm, direct, and specific. Never be vague when the data gives a clear answer.
- Match length to question: quick facts get short answers; explanations get full coverage.
- For maths, code, or formulas: use backtick formatting.`;

    const stream = await groq.chat.completions.create({
      model:       "llama-3.1-8b-instant",   // 500K TPD quota — separate from 70B limit
      messages:    [
        { role: "system", content: systemPrompt },
        ...messages.slice(-12),
      ],
      temperature: 0.65,
      max_tokens:  900,
      stream:      true,
    });

    const encoder  = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err) {
    console.error("[POST /api/ai/chat]", err);
    return Response.json({ error: "Chat service error. Please try again." }, { status: 500 });
  }
}
