"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Flame, Calendar, BarChart2, TrendingUp, Star,
} from "lucide-react";
import { format, subDays, subWeeks, startOfWeek, eachDayOfInterval } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StudyHeatmap, { type HeatmapDay } from "@/components/progress/StudyHeatmap";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Session { _id: string; subject: string; duration: number; date: string; }

/* ── Derived stats ──────────────────────────────────────────── */
function useHeatmapData(sessions: Session[]) {
  return useMemo(() => {
    const map: Record<string, HeatmapDay> = {};
    sessions.forEach(s => {
      const d = format(new Date(s.date), "yyyy-MM-dd");
      if (!map[d]) map[d] = { date: d, minutes: 0, sessions: 0, subjects: [] };
      map[d].minutes  += s.duration;
      map[d].sessions += 1;
      if (!map[d].subjects.includes(s.subject)) map[d].subjects.push(s.subject);
    });
    return Object.values(map);
  }, [sessions]);
}

function useSubjectStats(sessions: Session[]) {
  return useMemo(() => {
    const map: Record<string, { minutes: number; days: Set<string> }> = {};
    sessions.forEach(s => {
      if (!map[s.subject]) map[s.subject] = { minutes: 0, days: new Set() };
      map[s.subject].minutes += s.duration;
      map[s.subject].days.add(format(new Date(s.date), "yyyy-MM-dd"));
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, hours: +(v.minutes / 60).toFixed(1), activeDays: v.days.size }))
      .sort((a, b) => b.activeDays - a.activeDays);
  }, [sessions]);
}

function useConsistency(sessions: Session[], currentStreak: number) {
  return useMemo(() => {
    const last90 = sessions.filter(s => new Date(s.date) >= subDays(new Date(), 90));
    const uniqueDays90 = new Set(last90.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size;
    const totalMins90  = last90.reduce((a, s) => a + s.duration, 0);
    const avgDaily90   = uniqueDays90 > 0 ? Math.round(totalMins90 / uniqueDays90) : 0;

    const score = Math.round(
      Math.min(uniqueDays90 / 90, 1)    * 50 +
      Math.min(currentStreak  / 30, 1)  * 30 +
      Math.min(avgDaily90     / 120, 1) * 20
    );

    /* Monthly streaks: check each of last 6 months */
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = subWeeks(new Date(), i * 4);
      const wkStart = startOfWeek(d, { weekStartsOn: 1 });
      const wkEnd   = subDays(wkStart, -27); // ~4 weeks
      const days = eachDayOfInterval({ start: wkStart, end: wkEnd });
      const active = days.filter(day =>
        sessions.some(s => format(new Date(s.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
      ).length;
      return { label: format(d, "MMM"), active, total: days.length };
    }).reverse();

    return { score, uniqueDays90, avgDaily90, monthlyData };
  }, [sessions, currentStreak]);
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16,
        padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: 2 }}>{label}</p>
        {sub && <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: 1 }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Subject bar ────────────────────────────────────────────── */
const PALETTE = ["#E63946","#4895EF","#52B788","#D4A373","#9B5DE5","#F4A261","#2A9D8F","#E9C46A"];

export default function ProgressPage() {
  const { user }                    = useCurrentUser();
  const [sessions,  setSessions]    = useState<Session[]>([]);
  const [streak,    setStreak]      = useState({ current: 0, longest: 0 });
  const [totalRubies, setRubies]    = useState(0);
  const [year,      setYear]        = useState(new Date().getFullYear());

  useEffect(() => {
    fetch("/api/sessions").then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setSessions(d); });
    fetch("/api/stats").then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setStreak({ current: d.currentStreak, longest: d.longestStreak }); setRubies(d.totalRubies); }
    });
  }, []);

  const heatmapData   = useHeatmapData(sessions);
  const subjectStats  = useSubjectStats(sessions);
  const { score, uniqueDays90, avgDaily90, monthlyData } = useConsistency(sessions, streak.current);

  const totalHours  = +(sessions.reduce((a, s) => a + s.duration, 0) / 60).toFixed(1);
  const years       = [...new Set(sessions.map(s => new Date(s.date).getFullYear()))].sort((a, b) => b - a);
  if (years.length === 0) years.push(new Date().getFullYear());

  const scoreColor = score >= 70 ? "#52B788" : score >= 40 ? "#D4A373" : "#E63946";

  return (
    <DashboardLayout user={user} totalRubies={totalRubies} currentStreak={streak.current}>
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg,#52B788,#4895EF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(82,183,136,0.3)" }}>
              <Activity size={24} color="#fff"/>
            </div>
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                Study Progress
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Heatmap · Streaks · Consistency · Subject breakdown
              </p>
            </div>
          </div>
          {/* Year selector */}
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="input-base" style={{ width: "auto", padding: "6px 12px", fontSize: "0.875rem" }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12 }}>
          <StatCard icon={<Activity size={18}/>} label="Consistency Score" value={`${score}/100`}
            sub="Last 90 days" color={scoreColor}/>
          <StatCard icon={<Flame size={18}/>} label="Current Streak" value={`${streak.current}d`}
            sub={`Longest: ${streak.longest}d`} color="#E63946"/>
          <StatCard icon={<Calendar size={18}/>} label="Study Days (90d)" value={uniqueDays90}
            sub={`${Math.round((uniqueDays90 / 90) * 100)}% active`} color="#4895EF"/>
          <StatCard icon={<TrendingUp size={18}/>} label="Avg Session"
            value={`${avgDaily90}m`} sub="On active days" color="#9B5DE5"/>
          <StatCard icon={<Star size={18}/>} label="Total Hours" value={`${totalHours}h`}
            sub={`${sessions.length} sessions`} color="#D4A373"/>
        </div>

        {/* Annual Heatmap */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <BarChart2 size={16} color="var(--ruby)"/>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
              Study Activity — {year}
            </h2>
            <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
              {heatmapData.filter(d => new Date(d.date).getFullYear() === year && d.minutes > 0).length} active days
            </span>
          </div>
          {sessions.length > 0 ? (
            <StudyHeatmap data={heatmapData} year={year}/>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-tertiary)" }}>
              <Activity size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }}/>
              <p style={{ fontSize: "0.9375rem" }}>Log sessions to see your heatmap</p>
            </div>
          )}
        </div>

        {/* Monthly Consistency Bars */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 16 }}>
            Monthly Consistency (last 6 months)
          </h2>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            {monthlyData.map((m, i) => {
              const pct  = Math.round((m.active / m.total) * 100);
              const col  = pct >= 70 ? "#52B788" : pct >= 40 ? "#D4A373" : "#E63946";
              const barH = Math.max(8, Math.round((pct / 100) * 80));
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: col }}>{pct}%</span>
                  <div style={{ width: "100%", background: "var(--border)", borderRadius: 6, overflow: "hidden", height: 80,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <motion.div style={{ background: col, borderRadius: 6, width: "100%" }}
                      initial={{ height: 0 }} animate={{ height: barH }}
                      transition={{ duration: 0.6, delay: 0.1 }}/>
                  </div>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600 }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Comparison */}
        {subjectStats.length > 0 && (
          <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 16 }}>
              Subject Comparison
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subjectStats.map((s, i) => {
                const color  = PALETTE[i % PALETTE.length];
                const maxDay = subjectStats[0].activeDays;
                const pct    = maxDay > 0 ? Math.round((s.activeDays / maxDay) * 100) : 0;
                return (
                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }}/>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        <span><strong style={{ color: "var(--text-primary)" }}>{s.activeDays}</strong> active days</span>
                        <span><strong style={{ color: "var(--text-primary)" }}>{s.hours}h</strong> studied</span>
                      </div>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                      <motion.div style={{ height: "100%", borderRadius: 99, background: color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
