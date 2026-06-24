"use client";

import { motion } from "framer-motion";
import { Lock, Medal } from "lucide-react";
import { BADGES } from "@/lib/constants";

interface AchievementGridProps {
  unlockedIds: string[];
  compact?: boolean;
}

export default function AchievementGrid({ unlockedIds, compact = false }: AchievementGridProps) {
  const display = compact ? BADGES.slice(0, 4) : BADGES;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Medal size={16} style={{ color: "var(--gold)" }} />
        <span className="font-semibold text-sm" style={{ color: "var(--dark)" }}>
          Achievements
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(212,163,115,0.15)", color: "var(--gold)" }}
        >
          {unlockedIds.length}/{BADGES.length} unlocked
        </span>
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {display.map((badge, i) => {
          const unlocked = unlockedIds.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 22 }}
              whileHover={unlocked ? { y: -3 } : undefined}
              className="relative flex flex-col items-center text-center p-3 rounded-xl transition-all"
              style={{
                background: unlocked
                  ? `linear-gradient(135deg, ${badge.color}18, ${badge.color}08)`
                  : "rgba(45,45,45,0.04)",
                border: `1px solid ${unlocked ? badge.color + "30" : "rgba(45,45,45,0.08)"}`,
              }}
            >
              {/* Badge icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-all"
                style={{
                  background: unlocked ? `${badge.color}20` : "rgba(45,45,45,0.06)",
                  filter: unlocked ? "none" : "grayscale(1)",
                  opacity: unlocked ? 1 : 0.35,
                }}
              >
                {badge.icon}
              </div>

              <p className="text-xs font-semibold leading-tight mb-0.5" style={{ color: unlocked ? "var(--dark)" : "var(--dark-soft)", opacity: unlocked ? 1 : 0.4 }}>
                {badge.name}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--dark-soft)", opacity: 0.45 }}>
                {badge.description}
              </p>

              {!unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock size={10} style={{ color: "var(--dark-soft)", opacity: 0.3 }} />
                </div>
              )}

              {unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: badge.color }}
                >
                  <span className="text-[8px] text-white font-bold">✓</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
