import Groq from "groq-sdk";
import { connectDB } from "@/lib/mongodb";
import ResourceRecommendation from "@/models/ResourceRecommendation";
import StudySession from "@/models/StudySession";
import { getUserFromRequest } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ResourceResult {
  subject:         string;
  topic:           string;
  difficulty:      string;
  goal:            string;
  youtubeChannels: { name: string; url: string; why: string }[];
  websites:        { name: string; url: string; why: string }[];
  studyStrategy:   string[];
  roadmap:         string[];
  quickTips:       string[];
}

/* ── Known resource catalog (prevents hallucinated URLs) ──── */
const CATALOG = `
YOUTUBE CHANNELS (use ONLY these; pick the most relevant):
- Abdul Bari | url: https://www.youtube.com/@abdulbari7804 | topics: algorithms, data structures, TOC, compilers
- Apna College | url: https://www.youtube.com/@ApnaCollegeOfficial | topics: DSA, Java, Python, placement prep
- Love Babbar | url: https://www.youtube.com/@LoveBabbar | topics: DSA sheet, C++, placement, system design
- CodeWithHarry | url: https://www.youtube.com/@CodeWithHarry | topics: Python, web dev, Java, all programming
- Neso Academy | url: https://www.youtube.com/@nesoacademy | topics: digital electronics, COA, computer networks, signals, GATE
- Gate Smashers | url: https://www.youtube.com/@GateSmashers | topics: DBMS, OS, CN, compiler, GATE prep, TOC
- Jenny's Lectures | url: https://www.youtube.com/@jennyslecturescsit | topics: data structures, algorithms, C, programming
- Striver (take U forward) | url: https://www.youtube.com/@takeUforward | topics: DSA, system design, competitive programming
- Tech With Tim | url: https://www.youtube.com/@TechWithTim | topics: Python, AI/ML, web scraping, Django
- Sentdex | url: https://www.youtube.com/@sentdex | topics: Python, machine learning, AI, deep learning
- 3Blue1Brown | url: https://www.youtube.com/@3blue1brown | topics: mathematics, linear algebra, calculus, neural networks
- MIT OpenCourseWare | url: https://www.youtube.com/@mitocw | topics: mathematics, algorithms, machine learning, all CS
- freeCodeCamp | url: https://www.youtube.com/@freecodecamp | topics: web dev, Python, JS, React, backend, everything
- Traversy Media | url: https://www.youtube.com/@TraversyMedia | topics: web dev, JavaScript, React, Node.js
- CS Dojo | url: https://www.youtube.com/@CSDojo | topics: DSA, Python, interview prep
- mycodeschool | url: https://www.youtube.com/@mycodeschool | topics: data structures, algorithms, pointers, C
- The Organic Chemistry Tutor | url: https://www.youtube.com/@TheOrganicChemistryTutor | topics: mathematics, physics, chemistry, aptitude
- Khan Academy | url: https://www.youtube.com/@khanacademy | topics: mathematics, physics, chemistry, aptitude, all subjects
- Kunal Kushwaha | url: https://www.youtube.com/@KunalKushwaha | topics: DSA, Java, open source, placement

WEBSITES (use ONLY these; pick the most relevant):
- GeeksforGeeks | url: https://www.geeksforgeeks.org | topics: DSA, GATE, system design, all CS topics
- LeetCode | url: https://leetcode.com | topics: coding interviews, DSA, algorithms
- HackerRank | url: https://www.hackerrank.com | topics: coding practice, algorithms, SQL, Python
- CodeChef | url: https://www.codechef.com | topics: competitive programming, DSA
- Codeforces | url: https://codeforces.com | topics: competitive programming, algorithms
- Roadmap.sh | url: https://roadmap.sh | topics: web dev, backend, frontend, DevOps, learning paths
- NPTEL | url: https://nptel.ac.in | topics: engineering, CS, mathematics, GATE, all technical
- Coursera | url: https://www.coursera.org | topics: ML, AI, certificates, all subjects
- Khan Academy | url: https://www.khanacademy.org | topics: mathematics, physics, aptitude
- MIT OpenCourseWare | url: https://ocw.mit.edu | topics: mathematics, algorithms, all CS
- freeCodeCamp | url: https://www.freecodecamp.org | topics: web dev, algorithms, Python
- W3Schools | url: https://www.w3schools.com | topics: HTML, CSS, JavaScript, SQL, web dev
- MDN Web Docs | url: https://developer.mozilla.org | topics: HTML, CSS, JavaScript, web APIs
- JavaTpoint | url: https://www.javatpoint.com | topics: Java, Python, C, DBMS, OS, CN, all CS
- TutorialsPoint | url: https://www.tutorialspoint.com | topics: all programming, DBMS, OS, networking
`;

/* GET — fetch recommendation history */
export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const history = await ResourceRecommendation
      .find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return Response.json(history);
  } catch (err) {
    console.error("[GET /api/resources]", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

/* POST — generate AI resource recommendations */
export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subject, topic, difficulty, goal } = await request.json();

    if (!subject?.trim() || !topic?.trim()) {
      return Response.json({ error: "Subject and topic are required." }, { status: 400 });
    }

    /* ── Inject real weak-subject context from MongoDB ───── */
    let studentContext = "";
    try {
      const sessions = await StudySession.find({ userId: auth.userId }).lean();
      if (sessions.length > 0) {
        const total = sessions.reduce((a, s) => a + s.duration, 0);
        const subjectMap: Record<string, number> = {};
        sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
        const sorted = Object.entries(subjectMap).sort((a, b) => a[1] - b[1]);
        const leastStudied = sorted.slice(0, 3).map(([name, mins]) => {
          const pct = Math.round((mins / total) * 100);
          return `${name} (${+(mins/60).toFixed(1)}h, ${pct}% of study time)`;
        }).join(", ");
        studentContext = `
STUDENT'S ACTUAL STUDY DATA:
  Total study hours: ${+(total/60).toFixed(1)}h across ${sessions.length} sessions
  Least studied subjects (need most help): ${leastStudied}
  If the requested subject is in this list, prioritize foundational + practice resources.`;
      }
    } catch { /* continue without context */ }

    const prompt = `You are an expert educational resource recommender for Indian engineering students.

Student needs resources for:
  Subject: ${subject}
  Topic: ${topic}
  Difficulty: ${difficulty || "Intermediate"}
  Learning Goal: ${goal || "Deep understanding"}
${studentContext}

AVAILABLE RESOURCES CATALOG — select ONLY from these:
${CATALOG}

Return a single JSON object (no markdown, no extra text):
{
  "youtubeChannels": [
    { "name": "<channel name from catalog>", "url": "<exact url from catalog>", "why": "<1 sentence: why this channel for this specific topic>" }
  ],
  "websites": [
    { "name": "<site name from catalog>", "url": "<exact url from catalog>", "why": "<1 sentence: why this site for this specific topic>" }
  ],
  "studyStrategy": [
    "<step 1>", "<step 2>", "<step 3>", "<step 4>", "<step 5>"
  ],
  "roadmap": [
    "<Day 1-7: topic>", "<Day 8-14: topic>", "<Day 15-21: topic>", "<Day 22-30: topic>"
  ],
  "quickTips": [
    "<tip 1>", "<tip 2>", "<tip 3>"
  ]
}

RULES:
  - youtubeChannels: 3-5 channels, ONLY from the catalog above, most relevant to "${subject} / ${topic}"
  - websites: 4-6 sites, ONLY from the catalog above
  - studyStrategy: 5 concrete steps specific to "${topic}" in "${subject}"
  - roadmap: 4 week-blocks showing a realistic learning path
  - quickTips: 3 actionable tips for this specific topic
  - All URLs must be EXACTLY as listed in the catalog — no changes`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert educational resource recommender. Respond ONLY with valid JSON." },
        { role: "user",   content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    const rec = JSON.parse(jsonStr) as Omit<ResourceResult, "subject"|"topic"|"difficulty"|"goal">;

    /* Save to MongoDB */
    await connectDB();
    await ResourceRecommendation.create({
      userId: auth.userId, subject, topic,
      difficulty: difficulty || "Intermediate",
      goal: goal || "",
      ...rec,
    });

    return Response.json({ subject, topic, difficulty, goal, ...rec });
  } catch (err) {
    console.error("[POST /api/resources]", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "AI returned unexpected format. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Resource generation failed. Please try again." }, { status: 500 });
  }
}
