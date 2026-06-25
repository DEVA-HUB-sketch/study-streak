"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, AlertTriangle, Target, Clock, Zap, RefreshCw,
  TrendingUp, Shield, Activity, Bell,
} from "lucide-react";

/* ── Matches IAgentState shape returned from the API ────────── */
export interface AgentStateData {
  _id?:                    string;
  mission:                 string;
  priority:                string;
  studyGoal:               string;
  suggestedDuration:       number;
  bestStudyTime:           string;
  motivation:              string;
  warnings:                string[];
  predictedExamScore:      number | null;
  predictedGrade:          string | null;
  examConfidence:          string;
  weakSubject:             string | null;
  strongSubject:           string | null;
  riskLevel:               string;
  confidenceScore:         number;
  agentStatus:             string;
  nextRecommendation:      string;
  burnoutLevel:            string;
  burnoutRecommendation:   string;
  studyReminder:           string | null;
  completedTodayMinutes:   number;
  plannedTodayMinutes:     number;
  dailyReport:             string;
  weeklyInsight:           string;
  timetableRebalanceNeeded: boolean;
  timetableRebalanceReason: string;
  goalProgress:            string | null;
  generatedAt?:            string;
  stale?:                  boolean;
}

/* ── Status config ──────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  Active:     { bg: "rgba(82,183,136,0.12)",  color: "#52B788", label: "Active",     icon: <Activity size={11}/> },
  Monitoring: { bg: "rgba(72,149,239,0.12)",  color: "#4895EF", label: "Monitoring", icon: <Shield size={11}/> },
  Alert:      { bg: "rgba(230,57,70,0.12)",   color: "#E63946", label: "Alert",      icon: <AlertTriangle size={11}/> },
  Recovery:   { bg: "rgba(244,162,97,0.12)",  color: "#F4A261", label: "Recovery",   icon: <Zap size={11}/> },
};

const RISK_COLOR: Record<string, string> = {
  Low: "#52B788", Medium: "#D4A373", High: "#F4A261", Critical: "#E63946",
};

/* ── Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ background: "linear-gradient(135deg,#1F1F1F,#141010)", borderRadius: 20,
      padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)",
          animation: "shimmer 1.4s linear infinite" }}/>
        <div style={{ flex: 1, height: 18, borderRadius: 8, background: "rgba(255,255,255,0.06)",
          animation: "shimmer 1.4s linear infinite" }}/>
      </div>
      {[1, 2].map(i => (
        <div key={i} style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.04)",
          animation: "shimmer 1.4s linear infinite", width: i === 1 ? "85%" : "65%" }}/>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 32, flex: 1, borderRadius: 10, background: "rgba(255,255,255,0.04)",
            animation: "shimmer 1.4s linear infinite" }}/>
        ))}
      </div>
      <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
        🤖 Agent is analysing your study data…
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
interface Props { /** Called after a successful run so parent can refetch pinned plan */ onRebalanced?: () => void; }

export default function AIMissionCard({ onRebalanced }: Props) {
  const [state,   setState]   = useState<AgentStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const runAgent = useCallback(async () => {
    setRunning(true);
    try {
      const res  = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setState(data);
        if (data.timetableRebalanceNeeded) onRebalanced?.();
      }
    } catch { /* silent — agent failure shouldn't break dashboard */ }
    finally { setRunning(false); setLoading(false); }
  }, [onRebalanced]);

  /* On mount: check cache, run if stale/missing */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/agent/state");
        const data = await res.json();
        if (data && !data.stale) {
          setState(data);
          setLoading(false);
        } else {
          /* Stale or missing — trigger background run */
          await runAgent();
        }
      } catch {
        setLoading(false);
      }
    })();
  }, [runAgent]);

  const statusCfg = STATUS_CONFIG[state?.agentStatus ?? "Monitoring"] ?? STATUS_CONFIG.Monitoring;
  const todayPct  = state
    ? Math.min(Math.round((state.completedTodayMinutes / Math.max(state.plannedTodayMinutes, 1)) * 100), 100)
    : 0;

  return (
    <AnimatePresence mode="wait">
      {(loading || running) && !state ? (
        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Skeleton/>
        </motion.div>
      ) : state ? (
        <motion.div key="card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(160deg,#1A1A1A,#0F0F0F)",
            borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16,
            border: "1px solid rgba(255,255,255,0.07)" }}>

          {/* ── Header ──────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11,
                background: "linear-gradient(135deg,#E63946,#9B5DE5)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={18} color="#fff"/>
              </div>
              <div>
                <p style={{ fontWeight: 800, color: "#fff", fontSize: "0.9375rem", lineHeight: 1.2 }}>
                  Today&apos;s AI Mission
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3,
                    fontSize: "0.625rem", fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                    background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  {state.confidenceScore > 0 && (
                    <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.3)" }}>
                      {state.confidenceScore}% confidence
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={runAgent} disabled={running}
              title="Refresh agent analysis"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "5px 7px", cursor: "pointer",
                color: "rgba(255,255,255,0.45)", display: "flex", opacity: running ? 0.5 : 1 }}>
              <RefreshCw size={13} style={{ animation: running ? "spin 1s linear infinite" : "none" }}/>
            </button>
          </div>

          {/* ── Mission text ─────────────────────────────────── */}
          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.7, fontStyle: "italic" }}>
            &ldquo;{state.mission}&rdquo;
          </p>

          {/* ── Warnings ─────────────────────────────────────── */}
          {state.warnings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {state.warnings.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "8px 12px", borderRadius: 10,
                  background: "rgba(244,162,97,0.1)", border: "1px solid rgba(244,162,97,0.2)" }}>
                  <AlertTriangle size={13} color="#F4A261" style={{ flexShrink: 0, marginTop: 2 }}/>
                  <p style={{ fontSize: "0.8125rem", color: "#F4A261", lineHeight: 1.5 }}>{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Study Reminder ───────────────────────────────── */}
          {state.studyReminder && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8,
              padding: "8px 12px", borderRadius: 10,
              background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)" }}>
              <Bell size={13} color="#E63946" style={{ flexShrink: 0, marginTop: 2 }}/>
              <p style={{ fontSize: "0.8125rem", color: "#E63946", lineHeight: 1.5 }}>{state.studyReminder}</p>
            </div>
          )}

          {/* ── Today's progress bar ─────────────────────────── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>Today&apos;s Progress</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700,
                color: todayPct >= 100 ? "#52B788" : "rgba(255,255,255,0.6)" }}>
                {state.completedTodayMinutes}m / {state.plannedTodayMinutes}m ({todayPct}%)
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${todayPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 99,
                  background: todayPct >= 100 ? "#52B788" : todayPct >= 60 ? "#D4A373" : "#E63946" }}/>
            </div>
          </div>

          {/* ── Key metrics chips ────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Priority",  value: state.priority.split(" ").slice(0, 3).join(" ") + (state.priority.split(" ").length > 3 ? "…" : ""),
                icon: <Target size={12}/>,    color: "#E63946" },
              { label: "Best Time", value: state.bestStudyTime || "Flexible",
                icon: <Clock size={12}/>,     color: "#4895EF" },
              { label: "Risk",      value: state.riskLevel,
                icon: <TrendingUp size={12}/>, color: RISK_COLOR[state.riskLevel] ?? "#D4A373" },
            ].map(m => (
              <div key={m.label} style={{ padding: "10px 10px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: m.color }}>
                  {m.icon}
                  <span style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.07em" }}>{m.label}</span>
                </div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: m.color, lineHeight: 1.3 }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Next recommendation ──────────────────────────── */}
          {state.nextRecommendation && (
            <div style={{ padding: "10px 14px", borderRadius: 12,
              background: "rgba(155,93,229,0.08)", border: "1px solid rgba(155,93,229,0.2)" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9B5DE5",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                Next Action
              </p>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.55 }}>
                {state.nextRecommendation}
              </p>
            </div>
          )}

          {/* ── Timetable rebalanced notice ──────────────────── */}
          {state.timetableRebalanceNeeded && (
            <div style={{ padding: "8px 12px", borderRadius: 10,
              background: "rgba(82,183,136,0.08)", border: "1px solid rgba(82,183,136,0.2)",
              display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={13} color="#52B788"/>
              <p style={{ fontSize: "0.8125rem", color: "#52B788" }}>
                ✓ Timetable auto-rebalanced · {state.timetableRebalanceReason}
              </p>
            </div>
          )}

          {/* ── Daily report ─────────────────────────────────── */}
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6,
            borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
            {state.dailyReport}
          </p>

          {/* ── Motivation ───────────────────────────────────── */}
          <p style={{ fontSize: "0.8125rem", color: "#D4A373", fontStyle: "italic",
            textAlign: "center" }}>{state.motivation}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
