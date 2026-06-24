"use client";

import { motion } from "framer-motion";
import { Target, Gem, CheckCircle2 } from "lucide-react";

interface Challenge {
  title: string;
  description: string;
  target: number;
  unit: string;
  progress: number;
  completed: boolean;
  rubyReward: number;
}

interface DailyChallengeProps { challenge: Challenge | null; }

export default function DailyChallenge({ challenge }: DailyChallengeProps) {
  if (!challenge) return null;

  const pct = Math.min((challenge.progress / challenge.target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-5 card-gold"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} style={{ color: "var(--gold)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--dark)" }}>
          Daily Challenge
        </span>
        {challenge.completed && (
          <CheckCircle2 size={16} className="ml-auto" style={{ color: "#52B788" }} />
        )}
      </div>

      <p className="font-bold text-base mb-1" style={{ color: "var(--dark)" }}>
        {challenge.title}
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--dark-soft)", opacity: 0.6 }}>
        {challenge.description}
      </p>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-black/5 mb-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: challenge.completed
              ? "linear-gradient(90deg, #52B788, #40916C)"
              : "linear-gradient(90deg, var(--gold), var(--gold-light))",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--dark-soft)", opacity: 0.7 }}>
        <span>
          {challenge.progress} / {challenge.target} {challenge.unit}
        </span>
        <div className="flex items-center gap-1" style={{ color: "var(--ruby)" }}>
          <Gem size={11} />
          <span className="font-bold">+{challenge.rubyReward} rubies</span>
        </div>
      </div>
    </motion.div>
  );
}
