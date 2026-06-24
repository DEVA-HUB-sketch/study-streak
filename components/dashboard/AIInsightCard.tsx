"use client";

import { motion } from "framer-motion";
import { Bot, AlertTriangle, Trophy, TrendingUp, Lightbulb, Zap } from "lucide-react";
import Link from "next/link";
import type { Analytics } from "@/app/api/analytics/route";

const INSIGHT_CONFIG = {
  warning:     { icon: AlertTriangle, bg: "rgba(244,162,97,0.1)",  border: "rgba(244,162,97,0.25)",  color: "#F4A261", label: "Heads Up"    },
  achievement: { icon: Trophy,        bg: "rgba(212,163,115,0.1)", border: "rgba(212,163,115,0.25)", color: "#D4A373", label: "Achievement" },
  improvement: { icon: TrendingUp,    bg: "rgba(82,183,136,0.1)",  border: "rgba(82,183,136,0.25)",  color: "#52B788", label: "Progress"   },
  suggestion:  { icon: Lightbulb,     bg: "rgba(72,149,239,0.1)",  border: "rgba(72,149,239,0.25)",  color: "#4895EF", label: "Suggestion" },
  motivation:  { icon: Zap,           bg: "rgba(155,93,229,0.1)",  border: "rgba(155,93,229,0.25)",  color: "#9B5DE5", label: "Insight"    },
};

interface Props { analytics: Analytics; }

export default function AIInsightCard({ analytics }: Props) {
  const cfg  = INSIGHT_CONFIG[analytics.insightType] ?? INSIGHT_CONFIG.motivation;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        background: `linear-gradient(135deg, ${cfg.bg}, rgba(255,255,255,0))`,
        border: `1px solid ${cfg.border}`,
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      {/* AI + type icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
        border: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={18} color={cfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <Bot size={12} color={cfg.color} />
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.07em",
            textTransform: "uppercase", color: cfg.color }}>
            Today&apos;s AI Insight · {cfg.label}
          </span>
        </div>

        {/* Insight text */}
        <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: 1.65, fontWeight: 500 }}>
          {analytics.todayInsight}
        </p>

        {/* Quick stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <Chip label="Productivity" value={`${analytics.productivityScore}/100`} color={
            analytics.productivityScore >= 70 ? "#52B788" : analytics.productivityScore >= 40 ? "#D4A373" : "#E63946"
          }/>
          <Chip label="Streak"    value={`${analytics.currentStreak}d`}  color="#E63946" />
          <Chip label="This week" value={`${(analytics.thisWeekMinutes / 60).toFixed(1)}h`} color="#4895EF" />
          <Chip label="Badges"    value={`${analytics.achievementCount}/${analytics.totalBadges}`} color="#D4A373" />

          <Link href="/ai" style={{ marginLeft: "auto", fontSize: "0.8125rem", color: cfg.color,
            fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            Full AI Coach →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
