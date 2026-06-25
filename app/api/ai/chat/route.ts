import Groq from "groq-sdk";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import AgentMemory from "@/models/AgentMemory";
import { getUserFromRequest } from "@/lib/auth";
import { computeStreaks } from "@/lib/streaks";
import { format, subDays } from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { messages, course, subjects } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    /* ── Fetch real study data + agent memory ─────────────── */
    let studyContext = "";
    let memoryContext = "";
    try {
      await connectDB();
      const [sessions, memory] = await Promise.all([
        StudySession.find({ userId: auth.userId }).sort({ date: -1 }).limit(100).lean(),
        AgentMemory.findOne({ userId: auth.userId }).lean(),
      ]);

      /* Agent long-term memory */
      if (memory) {
        memoryContext = `
AGENT MEMORY (long-term student profile):
  Preferred study time: ${memory.preferredStudyTime}
  Learning style: ${memory.learningStyle}
  Known weak subjects: ${memory.weakSubjects.join(", ") || "none"}
  Known strong subjects: ${memory.strongSubjects.join(", ") || "none"}
  Consistency pattern: ${memory.consistencyPattern}
  Active goals: ${memory.activeGoals?.filter(g => !g.completed).map(g => g.description).join("; ") || "none"}`;
      }

      /* Live session data */
      if (sessions.length > 0) {
        const totalMinutes = sessions.reduce((a, s) => a + s.duration, 0);
        const { currentStreak, longestStreak } = computeStreaks(sessions.map(s => s.date));

        const subjectMap: Record<string, number> = {};
        sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
        const sorted = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
        const subjectLines = sorted.map(([name, mins]) => {
          const pct = Math.round((mins / totalMinutes) * 100);
          return `${name} (${+(mins / 60).toFixed(1)}h, ${pct}%)`;
        }).join(", ");

        const thisWeekMins = sessions
          .filter(s => new Date(s.date) >= subDays(new Date(), 6))
          .reduce((a, s) => a + s.duration, 0);

        const recentText = sessions.slice(0, 3)
          .map(s => `${format(new Date(s.date), "MMM d")}: ${s.subject} ${s.duration}min`)
          .join(", ");

        const leastStudied = sorted[sorted.length - 1];

        studyContext = `
STUDENT'S REAL STUDY DATA (use this to give personalised answers):
  Total studied: ${+(totalMinutes / 60).toFixed(1)}h across ${sessions.length} sessions
  Current streak: ${currentStreak} days | Best ever: ${longestStreak} days
  This week: ${+(thisWeekMins / 60).toFixed(1)}h
  Subject distribution: ${subjectLines}
  Least studied: ${leastStudied ? leastStudied[0] : "N/A"}
  Recent sessions: ${recentText}`;
      }
    } catch { /* continue without context if DB fails */ }

    const systemPrompt = `You are Study Buddy, a friendly AI tutor and academic coach powered by the Study Streak agent system.
${course   ? `Course: ${course}.` : ""}
${subjects ? `Subjects the student is studying: ${subjects}.` : ""}
${studyContext}
${memoryContext}

Rules:
- Reference the student's REAL study data and long-term memory when relevant.
- If they ask "which subject should I focus on?", check actual distribution and agent memory.
- If they ask "how am I doing?", mention their real streak, hours, and memory patterns.
- Use memory to personalise explanations to their learning style.
- Be concise, warm, and encouraging. Keep answers under 200 words unless asked for more.
- For formulas or code, wrap in backticks.
- Never say you are Llama or Groq — you are Study Buddy.`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-12),
      ],
      temperature: 0.75,
      max_tokens: 512,
      stream: true,
    });

    const encoder = new TextEncoder();
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
