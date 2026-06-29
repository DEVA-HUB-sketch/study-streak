import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface CareerRoadmap {
  career:      string;
  overview:    string;
  totalMonths: number;
  phases: {
    phase:       string;
    months:      string;
    theme:       string;
    skills:      string[];
    projects:    { name: string; description: string; tech: string[] }[];
    resources:   { name: string; url: string; type: string }[];
    milestone:   string;
  }[];
  coreSkills:       { name: string; level: "Beginner" | "Intermediate" | "Advanced"; priority: "Must" | "Should" | "Nice" }[];
  salaryRange:      string;
  jobRoles:         string[];
  interviewTopics:  string[];
  careerTip:        string;
}

const CAREER_CONTEXT: Record<string, string> = {
  "Full Stack Developer":  "web applications using React/Next.js frontend + Node.js/Express or Python backend, REST APIs, databases (PostgreSQL, MongoDB), deployment on cloud/Vercel",
  "AI Engineer":           "machine learning, deep learning (PyTorch/TensorFlow), LLMs, RAG pipelines, vector databases, MLOps, model fine-tuning",
  "Data Scientist":        "statistical analysis, Python (pandas, numpy, sklearn), data visualization, SQL, machine learning, business intelligence",
  "UI/UX Designer":        "user research, wireframing, Figma, design systems, usability testing, interaction design, front-end prototyping",
  "Cyber Security":        "network security, ethical hacking, penetration testing, OWASP, SIEM tools, cryptography, CompTIA Security+/CEH certifications",
  "Cloud Engineer":        "AWS/Azure/GCP, infrastructure as code (Terraform), Kubernetes, Docker, CI/CD pipelines, cloud architecture patterns",
  "DevOps":                "Docker, Kubernetes, CI/CD (GitHub Actions/Jenkins), Linux administration, monitoring (Grafana/Prometheus), cloud automation",
};

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { career, currentSkills = "", experienceYears = 0 } = await request.json();

    if (!career?.trim()) {
      return Response.json({ error: "Please enter or select a career path." }, { status: 400 });
    }

    /* Use predefined context if known, otherwise let AI use the career name directly */
    const context = CAREER_CONTEXT[career] ?? career;
    const level = Number(experienceYears) === 0 ? "complete beginner" :
                  Number(experienceYears) <= 1 ? "beginner with some basics" :
                  Number(experienceYears) <= 3 ? "intermediate learner" : "experienced developer";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "system",
        content: "You are a senior tech career mentor. Generate detailed, accurate, practical career roadmaps. Respond ONLY with valid JSON, no markdown."
      }, {
        role: "user",
        content: `Generate a complete career roadmap for becoming a ${career}.
Context: ${context}
Student level: ${level}
Current skills: ${currentSkills || "none specified"}

Return this EXACT JSON:
{
  "career": "${career}",
  "overview": "<2-3 sentences about this career path and why it's great>",
  "totalMonths": <realistic total months for this learner>,
  "phases": [
    {
      "phase": "Phase 1",
      "months": "Month 1-3",
      "theme": "<phase focus>",
      "skills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>"],
      "projects": [
        { "name": "<project name>", "description": "<what to build>", "tech": ["<tech 1>", "<tech 2>"] }
      ],
      "resources": [
        { "name": "<resource name>", "url": "<real URL>", "type": "Course|Book|Doc|YouTube" }
      ],
      "milestone": "<what you can do after this phase>"
    }
  ],
  "coreSkills": [
    { "name": "<skill>", "level": "Beginner|Intermediate|Advanced", "priority": "Must|Should|Nice" }
  ],
  "salaryRange": "<entry to senior salary range in INR/year>",
  "jobRoles": ["<role 1>", "<role 2>", "<role 3>", "<role 4>"],
  "interviewTopics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>", "<topic 5>"],
  "careerTip": "<one powerful piece of career advice specific to this role>"
}
RULES:
- phases: 3-5 phases covering the full journey
- coreSkills: 8-12 most important skills
- resources URLs must be real (freeCodeCamp, MDN, Coursera, YouTube, docs)
- Be specific to Indian job market for salary ranges`
      }],
      temperature: 0.6,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    const roadmap: CareerRoadmap = JSON.parse(jsonStr);
    return Response.json(roadmap);
  } catch (err) {
    console.error("[POST /api/career]", err);
    if (err instanceof SyntaxError) return Response.json({ error: "AI returned unexpected format." }, { status: 500 });
    return Response.json({ error: "Career roadmap generation failed." }, { status: 500 });
  }
}
