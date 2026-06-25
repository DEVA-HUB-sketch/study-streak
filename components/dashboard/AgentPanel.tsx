"use client";

import { motion } from "framer-motion";
import { Bot, Brain, Gem, TrendingUp, AlertCircle, CheckCircle, Target, Zap } from "lucide-react";
import type { AgentStateData } from "@/components/dashboard/AIMissionCard";

interface Props { state: AgentStateData | null; }

const BURNOUT_COLOR: Record<string, string> = {
  None: "#52B788", Low: "#4895EF", Medium: "#D4A373", High: "#F4A261", Critical: "#E63946",
};

const RISK_COLOR: Record<string, string> = {
  Low: "#52B788", Medium: "#D4A373", High: "#F4A261", Critical: "#E63946",
};

function Row({ label, value, color = "var(--text-primary)", icon }: {
  label: string; value: string | number; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ color, opacity: 0.7 }}>{icon}</span>}
        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

/* Mini radial score */
function ScoreRing({ value, color }: { value: number; color: string }) {
  const r = 22; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={52} height={52} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
        <motion.circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${(value / 100) * circ} ${circ}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}/>
      </svg>
      <span style={{ position: "absolute", fontSize: "0.75rem", fontWeight: 900, color }}>{value}</span>
    </div>
  );
}

export default function AgentPanel({ state }: Props) {
  if (!state) return null;

  const confColor = state.confidenceScore >= 70 ? "#52B788"
    : state.confidenceScore >= 40 ? "#D4A373" : "#E63946";

  return (
    <div className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Bot size={15} color="var(--ruby)"/>
          <h3 className="t-h3" style={{ fontSize: "0.875rem" }}>My AI Agent</h3>
        </div>
        <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: `${confColor}15`, color: confColor, border: `1px solid ${confColor}33` }}>
          {state.agentStatus}
        </span>
      </div>

      {/* Confidence + predicted score */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <ScoreRing value={state.confidenceScore} color={confColor}/>
          <p style={{ fontSize: "0.5625rem", color: "var(--text-tertiary)", marginTop: 2 }}>Confidence</p>
        </div>
        {state.predictedExamScore !== null && (
          <div style={{ textAlign: "center" }}>
            <ScoreRing value={state.predictedExamScore} color="#9B5DE5"/>
            <p style={{ fontSize: "0.5625rem", color: "var(--text-tertiary)", marginTop: 2 }}>Predicted</p>
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {state.predictedGrade && (
            <div style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(155,93,229,0.1)",
              display: "inline-flex", alignItems: "center", gap: 4, width: "fit-content" }}>
              <Gem size={10} color="#9B5DE5"/>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#9B5DE5" }}>
                {state.predictedGrade} predicted
              </span>
            </div>
          )}
          <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            {state.examConfidence} confidence
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {state.weakSubject && (
          <Row label="Needs Attention" value={state.weakSubject}
            color="#E63946" icon={<AlertCircle size={12}/>}/>
        )}
        {state.strongSubject && (
          <Row label="Strength" value={state.strongSubject}
            color="#52B788" icon={<CheckCircle size={12}/>}/>
        )}
        <Row label="Risk Level" value={state.riskLevel}
          color={RISK_COLOR[state.riskLevel] ?? "var(--text-primary)"}
          icon={<Target size={12}/>}/>
        <Row label="Burnout" value={state.burnoutLevel}
          color={BURNOUT_COLOR[state.burnoutLevel] ?? "#52B788"}
          icon={<Zap size={12}/>}/>
      </div>

      {/* Weekly insight */}
      {state.weeklyInsight && (
        <div style={{ padding: "8px 10px", borderRadius: 10,
          background: "rgba(72,149,239,0.06)", border: "1px solid rgba(72,149,239,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <TrendingUp size={11} color="#4895EF"/>
            <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#4895EF",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Weekly Pattern</span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            {state.weeklyInsight}
          </p>
        </div>
      )}

      {/* Burnout recommendation */}
      {state.burnoutLevel !== "None" && state.burnoutRecommendation && (
        <div style={{ padding: "8px 10px", borderRadius: 10,
          background: `${BURNOUT_COLOR[state.burnoutLevel] ?? "#F4A261"}0C`,
          border: `1px solid ${BURNOUT_COLOR[state.burnoutLevel] ?? "#F4A261"}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <Zap size={11} color={BURNOUT_COLOR[state.burnoutLevel] ?? "#F4A261"}/>
            <span style={{ fontSize: "0.5625rem", fontWeight: 700,
              color: BURNOUT_COLOR[state.burnoutLevel] ?? "#F4A261",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Burnout Advice</span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            {state.burnoutRecommendation}
          </p>
        </div>
      )}

      {/* Goal progress */}
      {state.goalProgress && (
        <div style={{ padding: "8px 10px", borderRadius: 10,
          background: "rgba(212,163,115,0.08)", border: "1px solid rgba(212,163,115,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <Brain size={11} color="#D4A373"/>
            <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#D4A373",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Goal Update</span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            {state.goalProgress}
          </p>
        </div>
      )}

      {/* Generated at */}
      {state.generatedAt && (
        <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", textAlign: "center" }}>
          Agent updated {new Date(state.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
