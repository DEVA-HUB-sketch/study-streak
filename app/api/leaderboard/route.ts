import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";
import { computeStreaks } from "@/lib/streaks";
import { computeRubies } from "@/lib/rubies";
import { getUserFromRequest } from "@/lib/auth";

/** Returns true only for 24-hex-char strings that MongoDB can cast to ObjectId */
function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    /* ── Aggregate session stats for ALL users ─────────────── */
    const grouped = await StudySession.aggregate([
      {
        $group: {
          _id: "$userId",
          totalMinutes:  { $sum: "$duration" },
          totalSessions: { $sum: 1 },
          /* Collect unique date strings for streak computation */
          dateStrings: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$date" } },
            },
          },
        },
      },
    ]);

    if (grouped.length === 0) {
      return Response.json([{
        rank: 1, username: "You", hoursStudied: 0,
        totalSessions: 0, totalRubies: 0, streak: 0, isCurrentUser: true,
      }]);
    }

    /* ── Fetch user names (only for valid ObjectId strings) ─── */
    const userIds = grouped.map(g => g._id).filter(isValidObjectId);
    const users   = await User.find({ _id: { $in: userIds } }).lean();
    const nameMap = new Map(users.map(u => [u._id.toString(), u.name]));

    /* ── Compute full ranking entry per user ────────────────── */
    const entries = grouped
      .filter(g => isValidObjectId(g._id)) // skip "guest" and any non-ObjectId userId
      .map(g => {
        const { currentStreak, longestStreak } = computeStreaks(g.dateStrings as string[]);
        const totalRubies = computeRubies(g.totalSessions, currentStreak, longestStreak, g.totalMinutes);
        return {
          userId:        g._id as string,
          username:      nameMap.get(g._id as string) ?? "Student",
          hoursStudied:  +(g.totalMinutes / 60).toFixed(1),
          totalSessions: g.totalSessions as number,
          totalRubies,
          streak:        currentStreak,
        };
      });

    /* ── Sort: rubies desc → hours desc ────────────────────── */
    entries.sort((a, b) => b.totalRubies - a.totalRubies || b.hoursStudied - a.hoursStudied);

    const ranked = entries.slice(0, 50).map((e, i) => ({
      rank:         i + 1,
      username:     e.username,
      hoursStudied: e.hoursStudied,
      totalSessions:e.totalSessions,
      totalRubies:  e.totalRubies,
      streak:       e.streak,
      isCurrentUser:e.userId === auth.userId,
    }));

    /* ── If current user isn't in top 50, append their entry ── */
    const inList = ranked.some(e => e.isCurrentUser);
    if (!inList) {
      const meIdx  = entries.findIndex(e => e.userId === auth.userId);
      const me     = entries[meIdx];
      if (me) {
        ranked.push({
          rank: meIdx + 1,
          username: me.username,
          hoursStudied: me.hoursStudied,
          totalSessions: me.totalSessions,
          totalRubies: me.totalRubies,
          streak: me.streak,
          isCurrentUser: true,
        });
      }
    }

    return Response.json(ranked);
  } catch (err) {
    console.error("[GET /api/leaderboard]", err);
    return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
