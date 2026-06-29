"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, GraduationCap, Gem, X, Target } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";

interface StudySession { _id:string; subject:string; duration:number; date:string; notes?:string; completed:boolean; }
interface Exam { _id:string; subject:string; examName:string; examDate:string; marksObtained:number; totalMarks:number; percentage:number; grade:string; }
interface Challenge { title:string; target:number; unit:string; progress:number; completed:boolean; rubyReward:number; }

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getMonthGrid(month: Date): Date[] {
  const start  = startOfWeek(startOfMonth(month));
  const end    = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
  return days;
}

export default function CalendarPage() {
  const { user } = useCurrentUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions,     setSessions]     = useState<StudySession[]>([]);
  const [exams,        setExams]        = useState<Exam[]>([]);
  const [challenge,    setChallenge]    = useState<Challenge | null>(null);
  const [selected,     setSelected]     = useState<Date | null>(null);
  const [loading,      setLoading]      = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, er, cr] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/exams"),
        fetch("/api/challenges"),
      ]);
      const [s, e, c] = await Promise.all([sr.json(), er.json(), cr.json()]);
      if (Array.isArray(s)) setSessions(s);
      if (Array.isArray(e)) setExams(e);
      if (c && !("error" in c)) setChallenge(c);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Group sessions by date */
  const sessionsByDate = useMemo(() => {
    const m: Record<string, StudySession[]> = {};
    sessions.forEach(s => {
      const key = format(parseISO(s.date), "yyyy-MM-dd");
      if (!m[key]) m[key] = [];
      m[key].push(s);
    });
    return m;
  }, [sessions]);

  /* Group exams by date */
  const examsByDate = useMemo(() => {
    const m: Record<string, Exam[]> = {};
    exams.forEach(e => {
      if (!m[e.examDate]) m[e.examDate] = [];
      m[e.examDate].push(e);
    });
    return m;
  }, [exams]);

  const today    = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const grid     = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);

  /* Month stats */
  const monthSessions = useMemo(() => sessions.filter(s => {
    const d = parseISO(s.date);
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
  }), [sessions, currentMonth]);
  const monthExams = useMemo(() => exams.filter(e => {
    const [y, m] = e.examDate.split("-").map(Number);
    return y === currentMonth.getFullYear() && m === currentMonth.getMonth() + 1;
  }), [exams, currentMonth]);
  const monthHours = monthSessions.reduce((a, s) => a + s.duration, 0) / 60;

  /* Selected day data */
  const selKey    = selected ? format(selected, "yyyy-MM-dd") : null;
  const selSess   = selKey ? (sessionsByDate[selKey] ?? []) : [];
  const selExams  = selKey ? (examsByDate[selKey]    ?? []) : [];
  const selTotal  = selSess.reduce((a, s) => a + s.duration, 0);

  return (
    <DashboardLayout user={user}>
      <div className="page-container" style={{ maxWidth: 960 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#E63946,#4895EF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.25rem" }}>📅</span>
            </div>
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)" }}>Study Calendar</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Track sessions, exams, and goals across months</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setCurrentMonth(new Date())}
              style={{ padding: "6px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--cream)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Today
            </button>
          </div>
        </div>

        {/* Month stats strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { icon: <BookOpen size={14} color="#E63946"/>, label: `${monthSessions.length} sessions this month`, color: "#E63946" },
            { icon: <span style={{ fontSize:"0.875rem" }}>⏱</span>,   label: `${monthHours.toFixed(1)}h studied`,       color: "#4895EF" },
            { icon: <GraduationCap size={14} color="#D4A373"/>,        label: `${monthExams.length} exams`,              color: "#D4A373" },
            ...(challenge ? [{ icon: <Target size={14} color="#52B788"/>, label: `${challenge.completed ? "Challenge done" : `${challenge.progress}/${challenge.target} ${challenge.unit}`}`, color: "#52B788" }] : []),
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99,
              background: `${item.color}10`, border: `1px solid ${item.color}25`, fontSize: "0.8125rem", color: item.color, fontWeight: 500 }}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
              style={{ width: 34, height: 34, borderRadius: 9, border: "1.5px solid var(--border)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} color="var(--text-secondary)"/>
            </button>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
              style={{ width: 34, height: 34, borderRadius: 9, border: "1.5px solid var(--border)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} color="var(--text-secondary)"/>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: "0.6875rem", fontWeight: 700,
                color: d === "Sun" || d === "Sat" ? "#E63946" : "var(--text-secondary)",
                letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          {loading ? (
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(230,57,70,0.2)", borderTopColor: "#E63946" }}/>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {grid.map((day, idx) => {
                const key        = format(day, "yyyy-MM-dd");
                const inMonth    = isSameMonth(day, currentMonth);
                const isToday_   = isSameDay(day, today);
                const isSel      = selected ? isSameDay(day, selected) : false;
                const daySess    = sessionsByDate[key] ?? [];
                const dayExams   = examsByDate[key]    ?? [];
                const dayMins    = daySess.reduce((a, s) => a + s.duration, 0);
                const isWeekend  = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div key={idx} onClick={() => { if (inMonth) setSelected(isSel ? null : day); }}
                    style={{ borderBottom: "1px solid var(--border)", borderRight: idx % 7 !== 6 ? "1px solid var(--border)" : "none",
                      minHeight: 90, padding: "8px 8px 6px", cursor: inMonth ? "pointer" : "default", position: "relative",
                      background: isSel ? "rgba(230,57,70,0.06)" : isToday_ ? "rgba(230,57,70,0.03)" : isWeekend ? "rgba(0,0,0,0.015)" : "#fff",
                      transition: "background 0.15s",
                      opacity: inMonth ? 1 : 0.35 }}>

                    {/* Day number */}
                    <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 5,
                      background: isToday_ ? "#E63946" : "transparent" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: isToday_ ? 700 : 400,
                        color: isToday_ ? "#fff" : isSel ? "#E63946" : "var(--text-primary)" }}>
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Session dots */}
                    {daySess.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                        {daySess.slice(0, 3).map((_, i) => (
                          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#E63946" }}/>
                        ))}
                        {daySess.length > 3 && <span style={{ fontSize: "0.5625rem", color: "#E63946" }}>+{daySess.length - 3}</span>}
                      </div>
                    )}

                    {/* Study time */}
                    {dayMins > 0 && (
                      <p style={{ fontSize: "0.5625rem", color: "#E63946", fontWeight: 600, marginBottom: 3 }}>
                        {Math.round(dayMins / 60 * 10) / 10}h
                      </p>
                    )}

                    {/* Exam marker */}
                    {dayExams.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: "0.625rem" }}>⭐</span>
                        <span style={{ fontSize: "0.5rem", color: "#D4A373", fontWeight: 700 }}>EXAM</span>
                      </div>
                    )}

                    {/* Today challenge */}
                    {key === todayKey && challenge?.completed && (
                      <div style={{ position: "absolute", bottom: 5, right: 6 }}>
                        <Gem size={11} color="#52B788"/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[
            { icon: <div style={{ width:8, height:8, borderRadius:"50%", background:"#E63946" }}/>, label:"Study session" },
            { icon: <span style={{ fontSize:"0.75rem" }}>⭐</span>, label:"Exam" },
            { icon: <Gem size={11} color="#52B788"/>, label:"Challenge complete" },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.75rem", color:"var(--text-secondary)" }}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        {/* Selected day panel */}
        <AnimatePresence>
          {selected && (selSess.length > 0 || selExams.length > 0) && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
              style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"1rem" }}>
                    {format(selected, "EEEE, MMMM d yyyy")}
                  </p>
                  {selTotal > 0 && (
                    <p style={{ fontSize:"0.8125rem", color:"#E63946", fontWeight:600 }}>
                      Total: {Math.round(selTotal / 60 * 10) / 10}h ({selSess.length} session{selSess.length !== 1?"s":""})
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)" }}>
                  <X size={16}/>
                </button>
              </div>

              {selSess.length > 0 && (
                <div>
                  <p style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Study Sessions</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {selSess.map(s => (
                      <div key={s._id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"#fff", border:"1px solid var(--border)", borderRadius:10 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:"#E63946", flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.875rem" }}>{s.subject}</p>
                          {s.notes && <p style={{ fontSize:"0.75rem", color:"var(--text-secondary)" }}>{s.notes}</p>}
                        </div>
                        <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"#E63946" }}>{s.duration}min</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selExams.length > 0 && (
                <div>
                  <p style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Exams</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {selExams.map(e => (
                      <div key={e._id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(212,163,115,0.06)", border:"1px solid rgba(212,163,115,0.2)", borderRadius:10 }}>
                        <span style={{ fontSize:"1rem" }}>⭐</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.875rem" }}>{e.subject} — {e.examName}</p>
                          <p style={{ fontSize:"0.75rem", color:"var(--text-secondary)" }}>{e.marksObtained}/{e.totalMarks} marks</p>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <p style={{ fontWeight:800, color:"#D4A373", fontSize:"0.9375rem" }}>{e.percentage}%</p>
                          <p style={{ fontSize:"0.6875rem", color:"var(--text-secondary)" }}>{e.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
