"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AchievementGrid from "@/components/achievements/AchievementGrid";
import { motion } from "framer-motion";
import { User, Gem, Clock, BookOpen, Flame, GraduationCap } from "lucide-react";
import { BADGES } from "@/lib/constants";

interface Stats {
  totalSessions: number; totalMinutes: number;
  currentStreak: number; longestStreak: number;
  totalRubies: number; unlockedBadgeIds: string[];
}

export default function ProfilePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => { if (d) setStats(d); });
  }, []);

  const hours = stats ? +(stats.totalMinutes / 60).toFixed(1) : 0;
  const rank = !stats ? "Beginner"
    : stats.totalSessions >= 100 ? "Legend"
    : stats.totalSessions >= 50  ? "Master"
    : stats.totalSessions >= 10  ? "Scholar"
    : "Beginner";

  return (
    <DashboardLayout totalRubies={stats?.totalRubies ?? 0}>
      <div className="p-5 max-w-4xl mx-auto">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6 card-gold"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
              style={{ background: "linear-gradient(135deg, var(--ruby), var(--ruby-dark))" }}
            >
              🎓
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold" style={{ color: "var(--dark)" }}>Future Achiever</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <GraduationCap size={14} style={{ color: "var(--gold)" }} />
                <span className="text-sm" style={{ color: "var(--dark-soft)", opacity: 0.65 }}>
                  Add your college &amp; department in settings
                </span>
              </div>

              {/* Rank badge */}
              <div
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-bold"
                style={{ background: "rgba(212,163,115,0.15)", color: "var(--gold)" }}
              >
                <User size={13} /> {rank}
              </div>
            </div>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { Icon: BookOpen, label: "Sessions",    value: stats?.totalSessions ?? 0, color: "var(--ruby)" },
              { Icon: Clock,    label: "Hours",        value: hours,                      color: "#4895EF" },
              { Icon: Flame,    label: "Best Streak",  value: `${stats?.longestStreak ?? 0}d`, color: "var(--ruby)" },
              { Icon: Gem,      label: "Rubies",       value: stats?.totalRubies ?? 0,    color: "#9B5DE5" },
            ].map(({ Icon, label, value, color }) => (
              <div
                key={label}
                className="flex flex-col items-center p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                <Icon size={18} style={{ color }} className="mb-1.5" />
                <p className="text-xl font-bold" style={{ color: "var(--dark)" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--dark-soft)", opacity: 0.5 }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <AchievementGrid unlockedIds={stats?.unlockedBadgeIds ?? []} />
      </div>
    </DashboardLayout>
  );
}
