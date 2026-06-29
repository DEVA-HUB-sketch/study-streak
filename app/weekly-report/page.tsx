"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, TrendingUp, Flame, AlertTriangle, CheckCircle,
  Printer, RefreshCw, Target, Brain, Zap, BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { WeeklyReport } from "@/app/api/weekly-report/route";

const BURNOUT_COLOR = { Safe: "#52B788", Caution: "#D4A373", High: "#E63946" };

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 140 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: "1.5rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: 2 }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

function DayBar({ day, minutes, maxMinutes }: { day: string; minutes: number; maxMinutes: number }) {
  const h = maxMinutes > 0 ? Math.max(4, Math.round((minutes / maxMinutes) * 80)) : 4;
  const isToday = new Date().toLocaleDateString("en-US", { weekday: "short" }) === day;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <p style={{ fontSize: "0.625rem", color: "var(--text-tertiary)" }}>{minutes > 0 ? `${Math.round(minutes / 60 * 10) / 10}h` : ""}</p>
      <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <motion.div initial={{ height: 0 }} animate={{ height: h }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ width: "60%", borderRadius: "4px 4px 0 0",
            background: minutes === 0 ? "var(--border)" : isToday ? "#E63946" : "#4895EF" }}/>
      </div>
      <p style={{ fontSize: "0.75rem", fontWeight: isToday ? 700 : 400, color: isToday ? "#E63946" : "var(--text-secondary)" }}>{day}</p>
    </div>
  );
}

export default function WeeklyReportPage() {
  const { user } = useCurrentUser();
  const [report,  setReport]  = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/weekly-report");
      const d   = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed to generate report"); return; }
      setReport(d as WeeklyReport);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const maxMins = report ? Math.max(...report.dailyBreakdown.map(d => d.minutes), 1) : 1;

  return (
    <DashboardLayout user={user}>
      <style>{`
        @media print {
          /* Hide DashboardLayout chrome */
          aside, header, nav, .no-print { display: none !important; }
          /* Reset body */
          html, body { background: white !important; margin: 0 !important; }
          /* Full-width main content */
          main {
            padding: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            flex: none !important;
          }
          /* Container */
          .print-page {
            max-width: 100% !important;
            padding: 0 !important;
            gap: 14px !important;
          }
          /* Prevent cards splitting across pages */
          .print-page > * { page-break-inside: avoid; }
          /* Remove shadows and borders */
          * { box-shadow: none !important; }
          /* Page settings */
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>

      <div className="page-container print-page" style={{ maxWidth: 900 }}>

        {/* Header */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#E63946,#D4A373)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={22} color="#fff"/>
            </div>
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)" }}>Weekly Study Report</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{report?.weekLabel ?? "Loading…"}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchReport} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--cream)", cursor: "pointer", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}/> Refresh
            </button>
            <button onClick={() => window.print()}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: "#E63946", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              <Printer size={14}/> Export PDF
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid rgba(230,57,70,0.2)", borderTopColor: "#E63946", margin: "0 auto 16px" }}/>
            <p style={{ color: "var(--text-secondary)" }}>Analysing your week with AI…</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: "rgba(230,57,70,0.07)", border: "1px solid rgba(230,57,70,0.2)", borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
            <p style={{ color: "#E63946" }}>{error}</p>
          </div>
        )}

        {report && !loading && (<>

          {/* Stat cards */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <StatCard icon={<BookOpen size={20} color="#E63946"/>} label="Total Hours" value={`${report.totalHours}h`} sub={`${report.totalSessions} sessions`} color="#E63946"/>
            <StatCard icon={<Flame size={20} color="#F4A261"/>} label="Streak" value={`${report.currentStreak}d`} sub="current streak" color="#F4A261"/>
            <StatCard icon={<Target size={20} color="#4895EF"/>} label="Consistency" value={`${report.consistencyScore}%`} sub="days studied / 7" color="#4895EF"/>
            <StatCard icon={<Brain size={20} color="#9B5DE5"/>} label="Focus Score" value={`${report.focusScore}/100`} sub="avg session quality" color="#9B5DE5"/>
          </div>

          {/* Daily bar chart */}
          <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 14px" }}>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, fontSize: "0.9375rem" }}>Daily Study Hours</p>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              {report.dailyBreakdown.map(d => (
                <DayBar key={d.day} day={d.day} minutes={d.minutes} maxMinutes={maxMins}/>
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Subject breakdown */}
            <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, fontSize: "0.9375rem" }}>Subject Breakdown</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {report.subjectBreakdown.length === 0
                  ? <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>No sessions this week</p>
                  : report.subjectBreakdown.map((s, i) => {
                    const colors = ["#E63946","#4895EF","#52B788","#9B5DE5","#F4A261","#D4A373"];
                    const c = colors[i % colors.length];
                    return (
                      <div key={s.subject}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.subject}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{s.hours}h ({s.percentage}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.percentage}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            style={{ height: "100%", borderRadius: 99, background: c }}/>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Performance scores */}
            <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9375rem" }}>Performance</p>
              {[
                { label: "Consistency",   value: report.consistencyScore, color: "#4895EF" },
                { label: "Focus Score",   value: report.focusScore,       color: "#9B5DE5" },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{m.label}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: m.color }}>{m.value}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }}
                      transition={{ duration: 0.9 }}
                      style={{ height: "100%", borderRadius: 99, background: m.color }}/>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 14px", borderRadius: 10,
                background: `${BURNOUT_COLOR[report.burnoutTrend]}18`,
                border: `1px solid ${BURNOUT_COLOR[report.burnoutTrend]}30` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={13} color={BURNOUT_COLOR[report.burnoutTrend]}/>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: BURNOUT_COLOR[report.burnoutTrend] }}>
                    Burnout Trend: {report.burnoutTrend}
                  </span>
                </div>
              </div>
              {report.weakSubjects.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#E63946", marginBottom: 6 }}>⚠ Needs Attention</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {report.weakSubjects.map(s => (
                      <span key={s} style={{ fontSize: "0.6875rem", padding: "3px 8px", borderRadius: 99, background: "rgba(230,57,70,0.1)", color: "#E63946", border: "1px solid rgba(230,57,70,0.2)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div style={{ background: "linear-gradient(160deg,#1F1F1F,#141010)", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Brain size={16} color="#9B5DE5"/>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.9375rem" }}>AI Performance Analysis</p>
            </div>

            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>{report.aiSummary}</p>

            {report.examPrediction && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(72,149,239,0.08)", border: "1px solid rgba(72,149,239,0.2)" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4895EF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Exam Prediction</p>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.8)" }}>{report.examPrediction}</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {report.achievements?.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#52B788", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Achievements</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {report.achievements.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <CheckCircle size={13} color="#52B788" style={{ flexShrink: 0, marginTop: 1 }}/>
                        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.improvements?.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#F4A261", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Improvements</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {report.improvements.map((imp, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <AlertTriangle size={13} color="#F4A261" style={{ flexShrink: 0, marginTop: 1 }}/>
                        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{imp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next week goals */}
          {report.nextWeekGoals?.length > 0 && (
            <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <TrendingUp size={16} color="#E63946"/>
                <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9375rem" }}>Next Week Goals</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.nextWeekGoals.map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(230,57,70,0.1)", border: "1.5px solid rgba(230,57,70,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "#E63946" }}>{i+1}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6 }}>{g}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivation */}
          {report.motivationClose && (
            <p style={{ textAlign: "center", fontSize: "1rem", color: "#D4A373", fontStyle: "italic", padding: "8px 0" }}>
              &ldquo;{report.motivationClose}&rdquo;
            </p>
          )}

        </>)}
      </div>
    </DashboardLayout>
  );
}
