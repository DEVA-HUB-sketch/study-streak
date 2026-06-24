import { connectDB } from "@/lib/mongodb";
import DailyChallenge from "@/models/DailyChallenge";
import StudySession from "@/models/StudySession";
import { CHALLENGE_POOL } from "@/lib/constants";
import { getUserFromRequest } from "@/lib/auth";
import { format } from "date-fns";

function pickChallenge(dateStr: string) {
  const idx = dateStr.split("-").reduce((acc, p) => acc + parseInt(p), 0) % CHALLENGE_POOL.length;
  return CHALLENGE_POOL[idx];
}

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = auth.userId;
    const today  = format(new Date(), "yyyy-MM-dd");

    let challenge = await DailyChallenge.findOne({ userId, date: today });

    if (!challenge) {
      const def = pickChallenge(today);
      challenge = await DailyChallenge.create({
        userId, challengeId: def.id, date: today,
        target: def.target, unit: def.unit, rubyReward: def.rubyReward,
      });
    }

    const start = new Date(today);
    const end   = new Date(today);
    end.setDate(end.getDate() + 1);

    const todaySessions = await StudySession.find({
      userId, date: { $gte: start, $lt: end },
    }).lean();

    const progress = challenge.unit === "minutes"
      ? todaySessions.reduce((acc, s) => acc + s.duration, 0)
      : todaySessions.length;

    const def = CHALLENGE_POOL.find((c) => c.id === challenge!.challengeId);

    return Response.json({
      id: challenge._id,
      challengeId: challenge.challengeId,
      title: def?.title ?? "Daily Challenge",
      description: def?.description ?? "",
      target: challenge.target,
      unit: challenge.unit,
      progress,
      completed: progress >= challenge.target,
      rubyReward: challenge.rubyReward,
    });
  } catch (err) {
    console.error("[GET /api/challenges]", err);
    return Response.json({ error: "Failed to fetch challenge" }, { status: 500 });
  }
}
