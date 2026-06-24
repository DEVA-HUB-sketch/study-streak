"use client";

import { useMemo, useState } from "react";
import {
  format, startOfWeek, addDays, eachDayOfInterval,
  getMonth, getYear, startOfYear, endOfYear,
} from "date-fns";

export interface HeatmapDay {
  date:     string;   // YYYY-MM-DD
  minutes:  number;
  sessions: number;
  subjects: string[];
}

interface Props { data: HeatmapDay[]; year?: number; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* 5-level colour scale: 0 = no study → 4 = intense */
function level(min: number): 0 | 1 | 2 | 3 | 4 {
  if (min === 0)   return 0;
  if (min < 30)    return 1;
  if (min < 60)    return 2;
  if (min < 120)   return 3;
  return 4;
}

const COLORS = [
  "rgba(0,0,0,0.06)",      // 0 — empty
  "rgba(82,183,136,0.30)", // 1 — light  (<30 min)
  "rgba(82,183,136,0.60)", // 2 — medium (30-60 min)
  "#52B788",               // 3 — strong (1-2 h)
  "#E63946",               // 4 — peak   (2 h+)
];

const CELL = 13;
const GAP  =  3;

export default function StudyHeatmap({ data, year }: Props) {
  const [tip, setTip] = useState<{ day: HeatmapDay; rect: DOMRect } | null>(null);
  const targetYear = year ?? new Date().getFullYear();

  const dataMap = useMemo(() => {
    const m: Record<string, HeatmapDay> = {};
    data.forEach(d => { m[d.date] = d; });
    return m;
  }, [data]);

  const { weeks, monthCols } = useMemo(() => {
    const yearStart = startOfYear(new Date(targetYear, 0, 1));
    const yearEnd   = endOfYear(new Date(targetYear, 0, 1));
    const gridStart = startOfWeek(yearStart, { weekStartsOn: 1 });

    const allDays   = eachDayOfInterval({ start: gridStart, end: yearEnd });

    const weeks: (HeatmapDay | null)[][] = [];
    let week: (HeatmapDay | null)[] = [];

    allDays.forEach(day => {
      const ds      = format(day, "yyyy-MM-dd");
      const inYear  = getYear(day) === targetYear;
      week.push(inYear ? (dataMap[ds] ?? { date: ds, minutes: 0, sessions: 0, subjects: [] }) : null);
      if (week.length === 7) { weeks.push(week); week = []; }
    });
    if (week.length > 0) weeks.push([...week, ...Array<null>(7 - week.length).fill(null)]);

    /* Month label column positions */
    const seen = new Set<number>();
    const monthCols: { month: number; col: number }[] = [];
    weeks.forEach((w, wi) => {
      const first = w.find(d => d !== null) as HeatmapDay | undefined;
      if (first) {
        const m = getMonth(new Date(first.date));
        if (!seen.has(m)) { seen.add(m); monthCols.push({ month: m, col: wi }); }
      }
    });

    return { weeks, monthCols };
  }, [dataMap, targetYear]);

  return (
    <div style={{ overflowX: "auto", position: "relative" }}>
      {/* Month labels */}
      <div style={{ position: "relative", height: 18, marginLeft: 30 }}>
        {monthCols.map(({ month, col }) => (
          <span key={month} style={{
            position: "absolute", left: col * (CELL + GAP),
            fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600,
          }}>
            {MONTHS[month]}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 6, paddingTop: 0 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{ height: CELL, display: "flex", alignItems: "center",
              fontSize: "0.5625rem", color: "var(--text-tertiary)", width: 22, justifyContent: "flex-end",
              visibility: i === 0 || i === 2 || i === 4 ? "visible" : "hidden" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "flex", gap: GAP }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
              {wk.map((day, di) => {
                if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                const lv = level(day.minutes);
                return (
                  <div key={di}
                    title=""
                    style={{
                      width: CELL, height: CELL, borderRadius: 3,
                      background: COLORS[lv], cursor: "default",
                      transition: "transform 0.1s",
                    }}
                    onMouseEnter={e => setTip({ day, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })}
                    onMouseLeave={() => setTip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tip && (
        <div style={{
          position: "fixed",
          left: tip.rect.left + CELL / 2,
          top:  tip.rect.top - 72,
          transform: "translateX(-50%)",
          zIndex: 9999, pointerEvents: "none",
          background: "#1A1A1A", color: "#fff",
          padding: "8px 12px", borderRadius: 9,
          fontSize: "0.75rem", lineHeight: 1.55,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 150,
        }}>
          <p style={{ fontWeight: 700, marginBottom: 3 }}>
            {format(new Date(tip.day.date), "MMMM d, yyyy")}
          </p>
          {tip.day.minutes > 0 ? (
            <>
              <p style={{ color: "#52B788" }}>
                {+(tip.day.minutes / 60).toFixed(1)}h · {tip.day.sessions} session{tip.day.sessions !== 1 ? "s" : ""}
              </p>
              {tip.day.subjects.length > 0 && (
                <p style={{ color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  {tip.day.subjects.slice(0, 3).join(", ")}
                  {tip.day.subjects.length > 3 ? ` +${tip.day.subjects.length - 3}` : ""}
                </p>
              )}
            </>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.4)" }}>No study activity</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>Less</span>
        {COLORS.map((c, i) => (
          <div key={i} style={{ width: CELL, height: CELL, borderRadius: 3, background: c,
            border: "1px solid rgba(0,0,0,0.06)" }} />
        ))}
        <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>More</span>
      </div>
    </div>
  );
}
