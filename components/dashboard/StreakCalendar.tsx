"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { format, subDays } from "date-fns";

interface StreakCalendarProps {
  weekGrid: boolean[];   // index 0 = 6 days ago, 6 = today
  currentStreak: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StreakCalendar({ weekGrid, currentStreak }: StreakCalendarProps) {
  const days = weekGrid.map((studied, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      label: format(date, "EEE"),
      date:  format(date, "d"),
      studied,
      isToday: i === 6,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl p-5 card-ruby"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={18} style={{ color: "var(--ruby)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--dark)" }}>
            Weekly Streak
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
          style={{ background: "rgba(230,57,70,0.12)", color: "var(--ruby)" }}
        >
          <Flame size={13} />
          {currentStreak} day{currentStreak !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="flex gap-2 justify-between">
        {days.map((day, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-1.5 flex-1"
          >
            <span className="text-xs" style={{ color: "var(--dark-soft)", opacity: 0.5 }}>
              {day.label}
            </span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: day.studied
                  ? "linear-gradient(135deg, var(--ruby), var(--ruby-dark))"
                  : "rgba(45,45,45,0.06)",
                color: day.studied ? "#fff" : "var(--dark-soft)",
                opacity: day.studied ? 1 : 0.5,
                outline: day.isToday ? "2px solid var(--ruby)" : "none",
              }}
            >
              {day.studied ? <Flame size={13} /> : day.date}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
