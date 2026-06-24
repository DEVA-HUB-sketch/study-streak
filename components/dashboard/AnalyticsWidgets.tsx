"use client";

import { motion } from "framer-motion";
import { BookOpen, AlertCircle, Target, BarChart2 } from "lucide-react";
import Link from "next/link";
import type { Analytics } from "@/app/api/analytics/route";
import type { PinnedPlan } from "@/components/dashboard/PinnedTimetableWidget";

interface Props {
  analytics:   Analytics;
  pinnedPlan?: PinnedPlan | null;
}

/* ── Mini radial bar ────────────────────────────────────────── */
function RadialBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct  = Math.min(value / max, 1);
  const r    = 28;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={34} cy={34} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <motion.circle cx={34} cy={34} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${pct * circ} ${circ}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span style={{ position: "absolute", fontSize: "0.875rem", fontWeight: 800, color }}>
        {value}
      </span>
    </div>
  );
}

/* ── Subject bar ────────────────────────────────────────────── */
function SubjectBar({ label, hours, pct, color }: { label: string; hours: number; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{hours}h</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
        <motion.div style={{ height: "100%", borderRadius: 99, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ── Widget card ────────────────────────────────────────────── */
function Widget({ title, icon, children, accent = "var(--ruby)" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16,
        padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsWidgets({ analytics, pinnedPlan }: Props) {
  const { mostStudiedSubject, leastStudiedSubject, totalMinutes, productivityScore, weeklyChangePercent } = analytics;

  /* Readiness — from pinned plan score or derived from productivity */
  const readinessScore = pinnedPlan?.examReadinessScore ?? Math.min(Math.round(productivityScore * 0.9), 100);
  const readinessColor = readinessScore >= 70 ? "#52B788" : readinessScore >= 45 ? "#D4A373" : "#E63946";
  const readinessLabel = readinessScore >= 70 ? "On Track" : readinessScore >= 45 ? "Needs Work" : "At Risk";
  const hasPinnedPlan  = !!pinnedPlan;

  /* Subject percentages */
  const mostPct  = totalMinutes > 0 && mostStudiedSubject
    ? Math.round((mostStudiedSubject.minutes  / totalMinutes) * 100) : 0;
  const leastPct = totalMinutes > 0 && leastStudiedSubject
    ? Math.round((leastStudiedSubject.minutes / totalMinutes) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>

      {/* Most Studied Subject */}
      <Widget title="Most Studied" icon={<BookOpen size={14}/>} accent="#4895EF">
        {mostStudiedSubject ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(72,149,239,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={18} color="#4895EF"/>
              </div>
              <div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {mostStudiedSubject.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {mostStudiedSubject.hours}h · {mostStudiedSubject.sessions} sessions
                </p>
              </div>
            </div>
            <SubjectBar label="Share of total" hours={mostStudiedSubject.hours} pct={mostPct} color="#4895EF"/>
          </>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>Log sessions to see data.</p>
        )}
      </Widget>

      {/* Weakest Subject */}
      <Widget title="Needs Attention" icon={<AlertCircle size={14}/>} accent="#E63946">
        {leastStudiedSubject ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(230,57,70,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={18} color="#E63946"/>
              </div>
              <div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {leastStudiedSubject.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {leastStudiedSubject.hours}h · {leastStudiedSubject.sessions} sessions
                </p>
              </div>
            </div>
            <SubjectBar label="Share of total" hours={leastStudiedSubject.hours} pct={leastPct} color="#E63946"/>
            <p style={{ fontSize: "0.75rem", color: "#E63946", fontStyle: "italic" }}>
              Only {leastPct}% of your time — consider a focused session today.
            </p>
          </>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>Study multiple subjects to see analysis.</p>
        )}
      </Widget>

      {/* Predicted Exam Readiness */}
      <Widget title="Exam Readiness" icon={<Target size={14}/>} accent={readinessColor}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <RadialBar value={readinessScore} color={readinessColor}/>
          <div>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: readinessColor, marginBottom: 2 }}>
              {readinessLabel}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              {hasPinnedPlan
                ? "Based on your pinned AI plan"
                : "Based on study consistency"}
            </p>
            {!hasPinnedPlan && (
              <Link href="/ai" style={{ fontSize: "0.75rem", color: "#9B5DE5", fontWeight: 600, textDecoration: "none" }}>
                Generate AI Plan →
              </Link>
            )}
          </div>
        </div>
        {weeklyChangePercent !== 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
            borderRadius: 8, background: weeklyChangePercent > 0 ? "rgba(82,183,136,0.08)" : "rgba(230,57,70,0.08)" }}>
            <BarChart2 size={12} color={weeklyChangePercent > 0 ? "#52B788" : "#E63946"}/>
            <span style={{ fontSize: "0.75rem", color: weeklyChangePercent > 0 ? "#52B788" : "#E63946", fontWeight: 600 }}>
              {weeklyChangePercent > 0 ? "+" : ""}{weeklyChangePercent}% vs last week
            </span>
          </div>
        )}
      </Widget>

    </div>
  );
}
