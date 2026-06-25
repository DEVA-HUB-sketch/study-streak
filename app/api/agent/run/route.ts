/**
 * POST /api/agent/run
 *
 * The core agentic pipeline. Pulls data from ALL student collections,
 * sends one comprehensive Groq call, then:
 *   1. Saves the AI reasoning to AgentState (3-hour cache)
 *   2. Updates AgentMemory (long-term student profile)
 *   3. Auto-rebalances the pinned timetable when needed
 *
 * This is the "brain" of the agent — it acts, not just advises.
 */
import Groq from "groq-sdk";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import ExamResult from "@/models/ExamResult";
import Subject from "@/models/Subject";
import User from "@/models/User";
import PinnedTimetable from "@/models/PinnedTimetable";
import DailyChallenge from "@/models/DailyChallenge";
import AgentState from "@/models/AgentState";
import AgentMemory from "@/models/AgentMemory";
import { getUserFromRequest } from "@/lib/auth";
import { computeStreaks } from "@/lib/streaks";
import { BADGES, AchievementStats } from "@/lib/constants";
import { computeRubies } from "@/lib/rubies";
import { format, subDays, isToday, parseISO } from "date-fns";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const CACHE_HOURS = 3;

/* ── Helpers ─────────────────────────────────────────────────── */
function safeParseISO(d: Date | string) {
  return typeof d === "string" ? parseISO(d) : d;
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    /* ── Collect ALL student data ──────────────────────────── */
    const [sessions, exams, subjects, user, pinnedPlan, memory] = await Promise.all([
      StudySession.find({ userId: auth.userId }).sort({ date: -1 }).lean(),
      ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).lean(),
      Subject.find({ userId: auth.userId }).lean(),
      User.findById(auth.userId).lean(),
      PinnedTimetable.findOne({ userId: auth.userId }).lean(),
      AgentMemory.findOne({ userId: auth.userId }).lean(),
    ]);

    /* ── Analytics ─────────────────────────────────────────── */
    const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
    const totalSessions = sessions.length;
    const { currentStreak, longestStreak } = computeStreaks(sessions.map(s => s.date));
    const totalRubies   = computeRubies(totalSessions, currentStreak, longestStreak, totalMinutes);
    const achieveStats: AchievementStats = { totalSessions, currentStreak, longestStreak, totalMinutes, totalRubies };
    const achievementCount = BADGES.filter(b => b.condition(achieveStats)).length;

    /* Today's completed study */
    const todaySessions   = sessions.filter(s => isToday(safeParseISO(s.date)));
    const completedToday  = todaySessions.reduce((a, s) => a + s.duration, 0);
    const plannedToday    = (user as { preferredStudyHours?: number })?.preferredStudyHours
      ? Math.round(((user as { preferredStudyHours?: number }).preferredStudyHours ?? 2) * 60)
      : 120;

    /* Subject distribution */
    const subjectMap: Record<string, number> = {};
    sessions.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.duration; });
    const subjectLines = Object.entries(subjectMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, mins]) => {
        const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
        return `  ${name}: ${+(mins / 60).toFixed(1)}h (${pct}%)`;
      }).join("\n") || "  No sessions yet";

    /* Weekly trend */
    const thisWeek  = sessions.filter(s => new Date(s.date) >= subDays(new Date(), 6)).reduce((a, s) => a + s.duration, 0);
    const lastWeek  = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= subDays(new Date(), 13) && d < subDays(new Date(), 6);
    }).reduce((a, s) => a + s.duration, 0);
    const weekChange = lastWeek > 0 ? +(((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) : 0;

    /* Burnout */
    const uniqueDays = new Set(sessions.map(s => format(safeParseISO(s.date), "yyyy-MM-dd"))).size;
    const avgDaily   = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;
    const burnoutRisk = currentStreak >= 7 && avgDaily >= 240;

    /* Exam context */
    const examLines = exams.slice(0, 10).map(e =>
      `  ${e.subject}: ${e.marksObtained}/${e.totalMarks} (${e.percentage}% ${e.grade}) on ${e.examDate}`
    ).join("\n") || "  No exam history";

    const examBySubject: Record<string, number[]> = {};
    exams.forEach(e => {
      if (!examBySubject[e.subject]) examBySubject[e.subject] = [];
      examBySubject[e.subject].push(e.percentage);
    });
    const examAvgLines = Object.entries(examBySubject)
      .map(([s, scores]) => `  ${s}: avg ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`)
      .join("\n") || "  No data";

    /* Timetable context */
    const timetableCtx = pinnedPlan
      ? `Pinned plan: ${pinnedPlan.course}, exam on ${pinnedPlan.examDate} (subjects: ${pinnedPlan.subjects})\n` +
        `Current slots:\n${pinnedPlan.timetable.map((t: { slot: string; subject: string; duration: string }) => `  ${t.slot}: ${t.subject} ${t.duration}`).join("\n")}`
      : "No pinned timetable";

    /* Memory context */
    const memCtx = memory
      ? `Preferred study time: ${memory.preferredStudyTime}\n` +
        `Learning style: ${memory.learningStyle}\n` +
        `Known weak subjects: ${memory.weakSubjects.join(", ") || "none"}\n` +
        `Known strong subjects: ${memory.strongSubjects.join(", ") || "none"}\n` +
        `Active goals: ${memory.activeGoals.filter(g => !g.completed).map(g => g.description).join("; ") || "none"}`
      : "No memory yet — first agent run";

    /* Current time context */
    const now      = new Date();
    const timeStr  = format(now, "EEEE, MMMM d yyyy, h:mm a");
    const hourOfDay = now.getHours();

    /* ── The Agent Prompt ──────────────────────────────────── */
    const systemPrompt = `You are the Study Streak Academic Agent — a proactive AI that reasons over real student data and makes intelligent decisions. You are NOT a chatbot. You analyse, decide, and act.
Respond ONLY with a single valid JSON object. No markdown, no extra text.`;

    const userPrompt = `Analyse this student's complete academic situation and generate your agent output.

STUDENT PROFILE:
  Name: ${user?.name ?? "Student"}
  College: ${(user as { college?: string })?.college ?? "Not set"}
  Target CGPA: ${(user as { targetCGPA?: number })?.targetCGPA ?? "Not set"}
  Exam goal: ${(user as { examTarget?: string })?.examTarget ?? "Not set"}

LONG-TERM MEMORY:
${memCtx}

CURRENT STATUS (right now: ${timeStr}):
  Total study hours: ${+(totalMinutes / 60).toFixed(1)}h across ${totalSessions} sessions
  Current streak: ${currentStreak} days | Longest: ${longestStreak} days
  This week: ${+(thisWeek / 60).toFixed(1)}h | Last week: ${+(lastWeek / 60).toFixed(1)}h | Change: ${weekChange >= 0 ? "+" : ""}${weekChange}%
  Avg daily study: ${avgDaily} min
  Achievements unlocked: ${achievementCount}/${BADGES.length}
  Burnout risk: ${burnoutRisk ? `YES (${currentStreak} days, avg ${avgDaily}min/day)` : "No"}
  Today completed: ${completedToday} min | Planned: ${plannedToday} min

SUBJECT TIME DISTRIBUTION:
${subjectLines}

EXAM HISTORY:
${examLines}

EXAM AVERAGE BY SUBJECT:
${examAvgLines}

TIMETABLE:
${timetableCtx}

CONTEXT:
  Hour of day: ${hourOfDay} (${hourOfDay < 12 ? "Morning" : hourOfDay < 17 ? "Afternoon" : hourOfDay < 21 ? "Evening" : "Night"})
  Behind today's goal by: ${Math.max(0, plannedToday - completedToday)} min

Return this EXACT JSON (every key required):
{
  "mission": "<2-3 sentence proactive mission directive for today — cite actual data>",
  "priority": "<single highest-priority action right now>",
  "studyGoal": "<specific, measurable study goal for today>",
  "suggestedDuration": <recommended study minutes remaining today as integer>,
  "bestStudyTime": "<specific time window recommendation like '7:00 PM – 9:00 PM'>",
  "motivation": "<personalised motivational message referencing actual streak/hours>",
  "warnings": ["<warning if falling behind, burnout risk, exam approaching, or empty array>"],
  "predictedExamScore": <integer 0-100 based on study pace and exam history, or null if no data>,
  "predictedGrade": "<grade like 'A+' or null>",
  "examConfidence": "<Low|Medium|High>",
  "weakSubject": "<most at-risk subject name from actual data, or null>",
  "strongSubject": "<strongest subject from actual data, or null>",
  "riskLevel": "<Low|Medium|High|Critical>",
  "confidenceScore": <integer 0-100 reflecting how confident agent is given data quality>,
  "agentStatus": "<Active|Monitoring|Alert|Recovery>",
  "nextRecommendation": "<specific next action with subject and duration>",
  "burnoutLevel": "<None|Low|Medium|High|Critical>",
  "burnoutRecommendation": "<targeted advice based on actual pattern>",
  "studyReminder": "<reminder message if >30min behind today's plan, else null>",
  "dailyReport": "<2-3 sentences summarising today's academic status with real numbers>",
  "weeklyInsight": "<1-2 sentences on weekly trend pattern>",
  "timetableRebalance": {
    "needed": <true if exam data shows a subject is underperforming relative to study time>,
    "reason": "<data-driven reason or empty string>",
    "adjustments": [
      { "subject": "<name>", "currentMinutes": <N>, "recommendedMinutes": <N>, "reason": "<why>" }
    ]
  },
  "goalProgress": "<update on active goals if any, or null>",
  "memoryUpdate": {
    "weakSubjects": ["<subjects with low marks or low study allocation>"],
    "strongSubjects": ["<subjects with high marks or high study allocation>"],
    "preferredStudyTime": "<time pattern if detectable from recent sessions, or keep existing>",
    "consistencyPattern": "<pattern description>"
  }
}

AGENT RULES:
- All claims must reference actual data above — never generic advice
- timetableRebalance.needed = true only when a specific subject has poor exam scores AND low study allocation
- confidenceScore should be lower (<50) when there are fewer than 5 sessions or no exam data
- agentStatus = "Alert" when riskLevel is High or Critical
- agentStatus = "Recovery" when burnoutLevel is High or Critical`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens:  2048,
    });

    const raw  = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    const agentOutput = JSON.parse(jsonStr);
    const { timetableRebalance, memoryUpdate, ...stateFields } = agentOutput;

    /* ── Action: Auto-rebalance timetable ─────────────────── */
    let rebalancedAt: Date | null = null;
    if (timetableRebalance?.needed && pinnedPlan && (timetableRebalance.adjustments ?? []).length > 0) {
      const adjustMap: Record<string, number> = {};
      (timetableRebalance.adjustments as { subject: string; recommendedMinutes: number }[])
        .forEach(a => { adjustMap[a.subject] = a.recommendedMinutes; });

      const rebalancedSlots = (pinnedPlan.timetable as { slot: string; subject: string; activity: string; duration: string }[])
        .map(slot => {
          if (adjustMap[slot.subject]) {
            return { ...slot, duration: `${adjustMap[slot.subject]} min` };
          }
          return slot;
        });

      await PinnedTimetable.updateOne(
        { userId: auth.userId },
        { $set: { timetable: rebalancedSlots } }
      );
      rebalancedAt = new Date();
    }

    /* ── Action: Update long-term memory ──────────────────── */
    const memPatch: Record<string, unknown> = {
      $inc: { totalInteractions: 1 },
    };
    if (memoryUpdate) {
      if (memoryUpdate.weakSubjects?.length)    memPatch["$set"] = { ...((memPatch["$set"] as object) ?? {}), weakSubjects: memoryUpdate.weakSubjects };
      if (memoryUpdate.strongSubjects?.length)  memPatch["$set"] = { ...((memPatch["$set"] as object) ?? {}), strongSubjects: memoryUpdate.strongSubjects };
      if (memoryUpdate.preferredStudyTime)      memPatch["$set"] = { ...((memPatch["$set"] as object) ?? {}), preferredStudyTime: memoryUpdate.preferredStudyTime };
      if (memoryUpdate.consistencyPattern)      memPatch["$set"] = { ...((memPatch["$set"] as object) ?? {}), consistencyPattern: memoryUpdate.consistencyPattern };
    }
    if (avgDaily > 0) memPatch["$set"] = { ...((memPatch["$set"] as object) ?? {}), avgSessionDuration: avgDaily };

    await AgentMemory.findOneAndUpdate(
      { userId: auth.userId },
      memPatch,
      { upsert: true }
    );

    /* ── Save AgentState (cache for 3 hours) ──────────────── */
    const validUntil = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000);

    const savedState = await AgentState.findOneAndUpdate(
      { userId: auth.userId },
      {
        ...stateFields,
        timetableRebalanceNeeded:  timetableRebalance?.needed ?? false,
        timetableRebalanceReason:  timetableRebalance?.reason ?? "",
        timetableAdjustments:      timetableRebalance?.adjustments ?? [],
        timetableRebalancedAt:     rebalancedAt,
        completedTodayMinutes:     completedToday,
        plannedTodayMinutes:       plannedToday,
        generatedAt:               new Date(),
        validUntil,
      },
      { upsert: true, new: true }
    );

    return Response.json(savedState);
  } catch (err) {
    console.error("[POST /api/agent/run]", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Agent returned unexpected format. Try again." }, { status: 500 });
    }
    return Response.json({ error: "Agent pipeline failed." }, { status: 500 });
  }
}
