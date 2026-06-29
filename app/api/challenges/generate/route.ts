import Groq from "groq-sdk";
import { connectDB } from "@/lib/mongodb";
import TestResult from "@/models/TestResult";
import { getUserFromRequest } from "@/lib/auth";
import type { IQuestion } from "@/models/TestResult";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { subject, topic, count = 10 } = body;
    let difficulty: string = body.difficulty ?? "Medium";

    /* ── Auto-calibrate difficulty from past test performance ── */
    let performanceContext = "";
    try {
      await connectDB();
      const pastTests = await TestResult
        .find({ userId: auth.userId, subject })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (pastTests.length > 0) {
        const avgPct = Math.round(
          pastTests.reduce((a, t) => a + t.percentage, 0) / pastTests.length
        );
        // Auto-upgrade/downgrade difficulty based on past performance
        if (avgPct >= 80 && difficulty === "Medium") {
          difficulty = "Hard";
          performanceContext = `Student averaged ${avgPct}% on the last ${pastTests.length} ${subject} tests — automatically upgraded to Hard.`;
        } else if (avgPct < 50 && difficulty === "Medium") {
          difficulty = "Easy";
          performanceContext = `Student averaged ${avgPct}% on the last ${pastTests.length} ${subject} tests — automatically adjusted to Easy for confidence building.`;
        } else {
          performanceContext = `Student past performance: ${avgPct}% avg across ${pastTests.length} ${subject} test(s). Current difficulty: ${difficulty}.`;
        }
      }
    } catch { /* proceed without calibration */ }

    if (!subject?.trim() || !topic?.trim()) {
      return Response.json({ error: "Subject and topic are required." }, { status: 400 });
    }

    const n = Math.min(Math.max(Number(count), 3), 15); // clamp 3–15

    const prompt = `You are an expert exam question setter for Indian engineering/college students.
${performanceContext ? `\nSTUDENT CONTEXT: ${performanceContext}\n` : ""}
Generate exactly ${n} multiple-choice questions (MCQ) for:
  Subject: ${subject}
  Topic: ${topic}
  Difficulty: ${difficulty}

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "questions": [
    {
      "question": "<clear, specific question about ${topic}>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctAnswer": <0-3 (index of correct option)>,
      "explanation": "<brief explanation of why the answer is correct, 1-2 sentences>"
    }
  ]
}

RULES:
- Every question must be directly about "${topic}" in "${subject}"
- Options must be plausible — no obviously wrong choices
- Exactly 4 options per question (index 0 to 3)
- correctAnswer must be an integer 0, 1, 2, or 3
- Difficulty "${difficulty}": ${
  difficulty === "Easy"   ? "recall and basic comprehension" :
  difficulty === "Medium" ? "application and understanding" :
  "analysis, evaluation, and edge cases"
}
- Do NOT repeat questions
- Explanations must teach the concept, not just restate the answer`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",   // 500K TPD quota — separate from 70B limit
      messages: [
        { role: "system", content: "You are an expert MCQ setter. Respond with valid JSON only." },
        { role: "user",   content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    const parsed = JSON.parse(jsonStr) as { questions: IQuestion[] };

    // Validate and sanitise
    const questions: IQuestion[] = (parsed.questions ?? [])
      .slice(0, n)
      .map(q => ({
        question:      String(q.question ?? ""),
        options:       (Array.isArray(q.options) ? q.options : []).slice(0, 4).map(String),
        correctAnswer: Number(q.correctAnswer ?? 0),
        explanation:   String(q.explanation ?? ""),
      }))
      .filter(q => q.question && q.options.length === 4);

    if (questions.length === 0) {
      return Response.json({ error: "AI returned no valid questions. Please try again." }, { status: 500 });
    }

    return Response.json({ subject, topic, difficulty, questions });
  } catch (err) {
    console.error("[POST /api/challenges/generate]", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "AI returned unexpected format. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Test generation failed. Please try again." }, { status: 500 });
  }
}

/* POST to save a completed test result */
export async function PUT(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { subject, topic, difficulty, questions } = body;

    const answered = (questions as IQuestion[]).filter(q => q.userAnswer !== undefined);
    const score    = answered.filter(q => q.userAnswer === q.correctAnswer).length;
    const total    = questions.length;

    await connectDB();
    const result = await TestResult.create({
      userId: auth.userId, subject, topic, difficulty,
      questions, score, totalQuestions: total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    console.error("[PUT /api/challenges/generate]", err);
    return Response.json({ error: "Failed to save result." }, { status: 500 });
  }
}
