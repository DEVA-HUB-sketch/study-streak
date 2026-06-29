/**
 * POST /api/study-assistant
 *
 * Real-time agentic study assistant.
 * Pulls the student's complete profile from MongoDB — sessions, exams,
 * agent memory, subjects, profile — and injects it into every Groq call.
 * The AI knows exactly who the student is and personalises every response:
 *   - Quiz difficulty is calibrated to their past exam scores
 *   - Summaries highlight their known weak areas
 *   - Flashcards prioritise concepts they struggle with
 *   - Explanations match their learning style from agent memory
 */
import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB }          from "@/lib/mongodb";
import { extractText }        from "unpdf";
import StudySession  from "@/models/StudySession";
import ExamResult    from "@/models/ExamResult";
import Subject       from "@/models/Subject";
import User          from "@/models/User";
import AgentMemory   from "@/models/AgentMemory";
import AgentState    from "@/models/AgentState";
import { format, subDays } from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type AssistantAction = "summarize" | "quiz" | "flashcards" | "keypoints" | "explain" | "checklist";

export interface AssistantResult {
  action:      AssistantAction;
  title:       string;
  content:     string;
  items?:      string[];
  quiz?:       { question: string; options: string[]; answer: string; explanation: string }[];
  flashcards?: { front: string; back: string }[];
}

/* ── Per-action prompt instructions ──────────────────────────── */
function buildActionPrompt(action: AssistantAction, weakSubjects: string[], examContext: string): string {
  const weakNote = weakSubjects.length > 0
    ? ` Pay extra attention to topics that overlap with the student's weak subjects: ${weakSubjects.join(", ")}.`
    : "";

  switch (action) {
    case "summarize":
      return `Summarise this document in clear, structured sections.${weakNote} Start with a 2-sentence overview. Then cover each major topic with key points. End with a "What to focus on" section that maps document topics to the student's weak areas.${examContext ? ` Note any topics that are likely to appear in: ${examContext}.` : ""}`;

    case "quiz":
      return `Generate 10 multiple-choice questions from this document. Make questions harder on topics where the student has lower exam scores.${weakNote} Return ONLY a JSON array: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."}]. Cover a range of difficulty: 3 easy, 4 medium, 3 hard.`;

    case "flashcards":
      return `Create 15 flashcards from the most important concepts.${weakNote} Prioritise concepts the student is likely to struggle with given their academic history. Return ONLY a JSON array: [{"front":"<concept or question>","back":"<clear explanation or answer>"}]. Make each back side 1-3 sentences — specific and testable.`;

    case "keypoints":
      return `Extract the 15 most important key points, facts, formulas, and concepts.${weakNote} Format as a numbered list. For each point: write it clearly and concisely. Group related points under bold headers. At the end, add a "Critical Review Points" section with 5 items the student must master before their exam.`;

    case "explain":
      return `Explain every difficult concept in this material simply and clearly. Use real-world analogies and step-by-step breakdowns. Adapt explanations to the student's learning style (from their profile below).${weakNote} For each concept: (1) Plain English explanation, (2) Real-world example, (3) One-line memory hook. Flag any concepts that frequently appear in exams.`;

    case "checklist":
      return `Create a comprehensive revision checklist of ALL topics and sub-topics from this material.${weakNote} Format as grouped checkboxes. Mark with ⚠ any topic that relates to the student's known weak subjects. Add a "Before Exam" section at the end with 5 critical things to verify they know. Prioritise by likely exam importance.`;
  }
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    const textRaw  = formData.get("text") as string | null;
    const action   = (formData.get("action") as AssistantAction) || "summarize";
    const query    = (formData.get("query") as string) || "";

    /* ── 1. Extract document text ────────────────────────────── */
    let extractedText = "";

    if (textRaw?.trim()) {
      extractedText = textRaw.trim();
    } else if (file) {
      const type = file.type;
      if (type === "text/plain" || file.name.endsWith(".txt")) {
        extractedText = await file.text();
      } else if (type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          const arrayBuf = await file.arrayBuffer();
          const { text } = await extractText(new Uint8Array(arrayBuf), { mergePages: true });
          extractedText  = text?.trim() ?? "";
          if (!extractedText) {
            return Response.json({
              error: "This PDF has no selectable text — it may be scanned. Switch to 'Paste Text' and paste your notes manually."
            }, { status: 400 });
          }
        } catch (pdfErr) {
          console.error("[PDF] Parse error:", pdfErr);
          return Response.json({
            error: "Could not read this PDF. Try: (1) Switch to 'Paste Text', or (2) Use a text-searchable PDF."
          }, { status: 400 });
        }
      } else {
        return Response.json({ error: "Unsupported file type. Please upload PDF or TXT." }, { status: 400 });
      }
    }

    if (!extractedText.trim()) {
      return Response.json({ error: "No content found. Please upload a file or paste text." }, { status: 400 });
    }

    /* ── 2. Fetch student context from MongoDB in parallel ────── */
    await connectDB();

    const [sessions, exams, dbSubjects, userDoc, memory, agentState] = await Promise.all([
      StudySession.find({ userId: auth.userId }).sort({ date: -1 }).limit(50).lean(),
      ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).limit(15).lean(),
      Subject.find({ userId: auth.userId }).lean(),
      User.findById(auth.userId)
        .select("name college department academicYear targetCGPA preferredStudyHours examTarget goals")
        .lean(),
      AgentMemory.findOne({ userId: auth.userId }).lean(),
      AgentState.findOne({ userId: auth.userId }).lean(),
    ]);

    /* ── 3. Compute analytics ────────────────────────────────── */
    const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
    const subjectMap: Record<string, number> = {};
    sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
    const subjectRanked = Object.entries(subjectMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, mins]) => `${name}:${+(mins/60).toFixed(1)}h(${totalMinutes > 0 ? Math.round(mins/totalMinutes*100) : 0}%)`)
      .join(", ") || "no sessions yet";

    /* Exam performance */
    const examBySubject: Record<string, number[]> = {};
    exams.forEach(e => {
      if (!examBySubject[e.subject]) examBySubject[e.subject] = [];
      examBySubject[e.subject].push(e.percentage);
    });
    const examAvgLines = Object.entries(examBySubject)
      .map(([subj, scores]) => {
        const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
        return `${subj}: avg ${avg}% (${scores.length} exam${scores.length>1?"s":""})`;
      }).join(", ") || "no exam data";

    const weakSubjects: string[] = [
      ...(memory?.weakSubjects ?? []),
      ...Object.entries(examBySubject)
        .filter(([, scores]) => scores.reduce((a,b)=>a+b,0)/scores.length < 60)
        .map(([name]) => name),
    ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

    const strongSubjects: string[] = [
      ...(memory?.strongSubjects ?? []),
      ...Object.entries(examBySubject)
        .filter(([, scores]) => scores.reduce((a,b)=>a+b,0)/scores.length >= 75)
        .map(([name]) => name),
    ].filter((v, i, a) => a.indexOf(v) === i);

    /* Upcoming exams */
    const upcomingExamContext = "";

    /* Recent sessions */
    const recentSessions = sessions.slice(0, 5)
      .map(s => `${format(new Date(s.date), "MMM d")}: ${s.subject} ${s.duration}min`)
      .join(", ") || "none";

    /* Today's stats */
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const todayMins = sessions
      .filter(s => format(new Date(s.date), "yyyy-MM-dd") === todayKey)
      .reduce((a, s) => a + s.duration, 0);
    const thisWeekMins = sessions
      .filter(s => new Date(s.date) >= subDays(new Date(), 6))
      .reduce((a, s) => a + s.duration, 0);

    /* ── 4. Build the comprehensive student context block ─────── */
    const studentProfile = `
════════════════════════════════════════════════
STUDENT PROFILE — Live data from MongoDB (${format(new Date(), "EEE MMM d yyyy, h:mm a")})
════════════════════════════════════════════════
Name:         ${userDoc?.name ?? "Student"}
College:      ${(userDoc as {college?:string})?.college ?? "—"}
Department:   ${(userDoc as {department?:string})?.department ?? "—"}
Year:         ${(userDoc as {academicYear?:string})?.academicYear ?? "—"}
Target CGPA:  ${(userDoc as {targetCGPA?:number})?.targetCGPA ?? "not set"}
Exam goal:    ${(userDoc as {examTarget?:string})?.examTarget ?? "not set"}
Goals:        ${(userDoc as {goals?:string})?.goals ?? "not set"}

STUDY HISTORY:
  Total studied: ${+(totalMinutes/60).toFixed(1)}h across ${sessions.length} sessions
  Today: ${todayMins}min | This week: ${+(thisWeekMins/60).toFixed(1)}h
  Subjects (by time): ${subjectRanked}
  Recent sessions: ${recentSessions}

EXAM PERFORMANCE:
  ${examAvgLines}
  Last 5 exams: ${exams.slice(0,5).map(e => `${e.subject}:${e.percentage}%(${e.grade})`).join(", ") || "none"}

AI AGENT MEMORY (learned patterns):
  Weak subjects: ${weakSubjects.join(", ") || "none identified yet"}
  Strong subjects: ${strongSubjects.join(", ") || "none identified yet"}
  Learning style: ${memory?.learningStyle ?? "not determined"}
  Study pattern: ${memory?.consistencyPattern ?? "insufficient data"}
  Preferred study time: ${memory?.preferredStudyTime ?? "not determined"}
  Active goals: ${memory?.activeGoals?.filter(g=>!g.completed).map(g=>g.description).join("; ") || "none"}

CURRENT AGENT STATUS:
  ${agentState ? `Risk level: ${agentState.riskLevel} | Burnout: ${agentState.burnoutLevel} | Agent: ${agentState.agentStatus}` : "No agent data yet"}
  ${agentState?.mission ? `Today's mission: ${agentState.mission}` : ""}

SUBJECT LIBRARY:
  ${dbSubjects.map(s => s.name).join(", ") || "none saved"}
════════════════════════════════════════════════`;

    /* ── 5. Build personalised action prompt ─────────────────── */
    const actionInstruction = buildActionPrompt(action, weakSubjects, upcomingExamContext);
    const isJson = action === "quiz" || action === "flashcards";

    /* Truncate document to ~10k chars to leave room for context */
    const docText = extractedText.slice(0, 10000);

    const systemPrompt = `You are an expert AI Study Assistant with full access to this student's academic profile, study history, and performance data.
You are NOT a generic AI. You know exactly who this student is, how they study, and where they struggle.
Use ALL the student data below to make every response deeply personalised and accurate.
${isJson ? "For this task, respond ONLY with valid JSON (no markdown fences, no extra text)." : "Format your response with clear headers, structured sections, and bullet points for readability."}`;

    const userPrompt = `${studentProfile}

════════════════════════════════════════════════
DOCUMENT TO ANALYSE:
File: ${file?.name ?? "Pasted Text"}
════════════════════════════════════════════════
${docText}
════════════════════════════════════════════════

TASK: ${actionInstruction}
${query ? `\nSTUDENT'S SPECIFIC QUESTION: "${query}"\nAnswer this directly and thoroughly using both the document AND the student's profile above.` : ""}

PERSONALISATION RULES:
1. Address the student by name (${userDoc?.name?.split(" ")[0] ?? "Student"})
2. Cross-reference document topics with their weak subjects: [${weakSubjects.join(", ") || "none yet"}]
3. Calibrate difficulty to their actual exam performance shown above
4. Match explanations to their learning style: ${memory?.learningStyle ?? "general"}
5. Reference their specific subjects and exam scores when relevant
6. If the document topic overlaps with a weak subject, flag it prominently`;

    /* ── 6. Call Groq ────────────────────────────────────────── */
    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens:  3500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    /* ── 7. Parse and return ─────────────────────────────────── */
    const result: AssistantResult = {
      action,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} — ${file?.name ?? "Pasted Text"}`,
      content: raw,
    };

    if (action === "quiz") {
      try {
        let jsonStr = raw.trim();
        const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fence) jsonStr = fence[1].trim();
        result.quiz = JSON.parse(jsonStr);
      } catch { /* keep raw content if JSON parse fails */ }
    } else if (action === "flashcards") {
      try {
        let jsonStr = raw.trim();
        const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fence) jsonStr = fence[1].trim();
        result.flashcards = JSON.parse(jsonStr);
      } catch { /* keep raw content */ }
    }

    console.log(`[StudyAssistant] userId=${auth.userId} action=${action} docLen=${docText.length} weakSubjects=${weakSubjects.join(",")}`);
    return Response.json(result);

  } catch (err) {
    console.error("[POST /api/study-assistant]", err);
    return Response.json({ error: "Study assistant failed. Please try again." }, { status: 500 });
  }
}
