import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AIStudyPlan {
  examReadinessScore: number;
  motivationMessage: string;
  studyStrategy: string;
  dailyTargets: string[];
  timetable: { slot: string; subject: string; activity: string; duration: string }[];
  subjectMethods: { subject: string; priority: string; methods: string[]; tip: string }[];
  weeklyRoadmap: { week: string; theme: string; goals: string[] }[];
  resources: { subject: string; items: string[] }[];
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

    const daysLeft = Math.max(
      1,
      Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000)
    );
    const weeksCount = Math.min(4, Math.ceil(daysLeft / 7));

    const systemPrompt = `You are an expert AI Study Coach for college students.
Respond ONLY with a single valid JSON object — no markdown fences, no extra text.`;

    const userPrompt = `Create a comprehensive, personalized study plan for this student.

STUDENT PROFILE
- Name: ${name || "Student"}
- Course: ${course}
- Year: ${year || "Not specified"}
- All Subjects: ${subjects}
- Weak Subjects (need extra focus): ${weakSubjects || "None specified"}
- Strong Subjects (already comfortable): ${strongSubjects || "None specified"}
- Exam Date: ${examDate} (${daysLeft} days away)
- Daily Study Hours Available: ${studyHours}

Return a JSON object with EXACTLY these keys:

{
  "examReadinessScore": <integer 0-100>,
  "motivationMessage": "<2-3 personalized, encouraging sentences>",
  "studyStrategy": "<3-4 sentences describing the overall approach for this timeline>",
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
    { "subject": "<name>", "items": ["<resource or study tip>", "<resource>", "<resource>"] }
  ]
}

RULES:
- timetable: exactly ${studyHours <= 4 ? 4 : 6} slots, total duration ≈ ${studyHours}h, include short breaks
- subjectMethods: one entry for EVERY subject listed
- weeklyRoadmap: exactly ${weeksCount} entries
- resources: focus on weak subjects first, then others; be specific (book names, YouTube channels, websites)
- examReadinessScore: lower if few days remain or many weak subjects; higher if plenty of time
- All content must be specific to the subjects mentioned, never generic`;

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

    // Strip optional markdown fences the model may still include
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
