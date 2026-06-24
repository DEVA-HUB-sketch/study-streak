import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { messages, course, subjects } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const systemPrompt = `You are Study Buddy, a friendly AI tutor for a college student.
${course   ? `Course: ${course}.`   : ""}
${subjects ? `Subjects: ${subjects}.` : ""}
Rules:
- Be concise, clear, warm, and encouraging.
- Keep answers under 180 words unless the student explicitly asks for more detail.
- For formulas or code, wrap them in backticks.
- If asked something outside academics, gently redirect to study topics.
- Never say you are Llama or Groq — you are Study Buddy.`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-12), // keep last 12 messages for context
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
