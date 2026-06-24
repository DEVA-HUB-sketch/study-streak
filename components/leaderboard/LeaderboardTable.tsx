"use client";

import { motion } from "framer-motion";
import { Trophy, Gem, Clock, BookOpen, Flame } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  hoursStudied: number;
  totalSessions: number;
  totalRubies: number;
  streak: number;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps { entries: LeaderboardEntry[]; }

const RANK_STYLE: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "#FFD700", text: "#8B6914", label: "🥇" },
  2: { bg: "#C0C0C0", text: "#555",    label: "🥈" },
  3: { bg: "#CD7F32", text: "#fff",    label: "🥉" },
};

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={16} style={{ color: "var(--gold)" }} />
        <h2 className="font-semibold text-sm" style={{ color: "var(--dark)" }}>Global Leaderboard</h2>
      </div>

      {/* Header */}
      <div className="grid grid-cols-5 gap-2 px-3 mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--dark-soft)", opacity: 0.45 }}>
        <span>Rank</span>
        <span className="col-span-2">Player</span>
        <span className="text-right">Hours</span>
        <span className="text-right">Rubies</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const rankStyle = RANK_STYLE[entry.rank];
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="grid grid-cols-5 gap-2 items-center px-3 py-3 rounded-xl"
              style={{
                background: entry.isCurrentUser
                  ? "linear-gradient(90deg, rgba(230,57,70,0.08), rgba(230,57,70,0.03))"
                  : "rgba(255,255,255,0.4)",
                border: entry.isCurrentUser ? "1px solid rgba(230,57,70,0.2)" : "1px solid transparent",
              }}
            >
              {/* Rank */}
              <div className="flex items-center gap-1.5">
                {rankStyle ? (
                  <span className="text-lg">{rankStyle.label}</span>
                ) : (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(45,45,45,0.08)", color: "var(--dark-soft)" }}
                  >
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Username */}
              <div className="col-span-2">
                <p className="text-sm font-semibold" style={{ color: "var(--dark)" }}>
                  {entry.username}
                  {entry.isCurrentUser && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(230,57,70,0.12)", color: "var(--ruby)" }}>
                      You
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--dark-soft)", opacity: 0.5 }}>
                    <Flame size={10} /> {entry.streak}d
                  </span>
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--dark-soft)", opacity: 0.5 }}>
                    <BookOpen size={10} /> {entry.totalSessions}
                  </span>
                </div>
              </div>

              {/* Hours */}
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: "var(--dark)" }}>{entry.hoursStudied}h</p>
                <p className="text-[10px]" style={{ color: "var(--dark-soft)", opacity: 0.4 }}>hours</p>
              </div>

              {/* Rubies */}
              <div className="text-right flex items-center justify-end gap-1">
                <span className="text-sm font-bold" style={{ color: "var(--ruby)" }}>{entry.totalRubies}</span>
                <Gem size={11} style={{ color: "var(--ruby)" }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
