"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, ExternalLink, PinOff, Star, X,
  ChevronDown, ChevronUp, BookOpen, Map,
} from "lucide-react";
import toast from "react-hot-toast";

interface TimetableRow { slot: string; subject: string; activity: string; duration: string; }
interface RoadmapWeek  { week: string; theme:    string; goals:    string[]; }

export interface PinnedPlan {
  _id:                 string;
  userId:              string;
  course:              string;
  subjects:            string;
  examDate:            string;
  studyHours:          string;
  examReadinessScore:  number;
  timetable:           TimetableRow[];
  weeklyRoadmap:       RoadmapWeek[];
  reviewed:            boolean;
  createdAt:           string;
}

interface Props { plan: PinnedPlan; onRemoved: () => void; }

/* ── Colour helpers ─────────────────────────────────────────── */
const PALETTE = ["#E63946","#4895EF","#52B788","#D4A373","#9B5DE5","#F4A261","#2A9D8F","#E9C46A"];

function subjectCol(name: string, subjects: string[]) {
  const i = subjects.indexOf(name);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}

/* ── Review modal ───────────────────────────────────────────── */
function ReviewModal({ examPassed, onSubmit, onSkip }: {
  examPassed: boolean;
  onSubmit: (rating: number, text: string) => void;
  onSkip:   () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover,  setHover]  = useState(0);
  const [text,   setText]   = useState("");

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:60,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        style={{ background:"var(--warm-white)", borderRadius:20, padding:28, maxWidth:420,
          width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>

        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:"2.5rem", marginBottom:10 }}>{examPassed ? "🎉" : "📝"}</div>
          <h2 style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.03em",
            color:"var(--text-primary)", marginBottom:6 }}>
            {examPassed ? "How did your exam go?" : "Remove your study plan?"}
          </h2>
          <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.6 }}>
            {examPassed
              ? "Your exam date has passed! Share your experience."
              : "Before removing, rate how helpful this plan was."}
          </p>
        </div>

        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:16 }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} type="button"
              onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(s)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              <Star size={28}
                fill={(hover||rating)>=s ? "#D4A373" : "none"}
                color={(hover||rating)>=s ? "#D4A373" : "var(--border-strong)"}/>
            </button>
          ))}
        </div>

        <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
          placeholder="How accurate was the timetable? What would you improve?"
          className="input-base" style={{ width:"100%", resize:"none", marginBottom:16, fontSize:"0.875rem" }}/>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>onSubmit(rating, text)} className="btn btn-primary" style={{ flex:1 }}>
            {rating > 0 ? "Submit & Remove" : "Submit"}
          </button>
          <button onClick={onSkip} className="btn btn-secondary" style={{ gap:6 }}>
            <X size={13}/> Skip
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Full plan modal ────────────────────────────────────────── */
function FullPlanModal({ plan, onClose }: { plan: PinnedPlan; onClose: () => void }) {
  const subjects = plan.subjects.split(",").map(s => s.trim()).filter(Boolean);
  const TH = {
    padding:"9px 12px", textAlign:"left" as const,
    fontSize:"0.6875rem", fontWeight:700, color:"rgba(255,255,255,0.4)",
    letterSpacing:"0.07em", textTransform:"uppercase" as const,
    background:"rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.07)",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:70,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <motion.div initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95 }}
        style={{ background:"#1A1A1A", borderRadius:20, padding:24, maxWidth:700, width:"100%",
          maxHeight:"88vh", overflowY:"auto", border:"1px solid rgba(255,255,255,0.1)",
          boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Calendar size={18} color="#E63946"/>
            <div>
              <p style={{ fontWeight:800, color:"#fff", fontSize:"1.0625rem" }}>📌 Active Study Plan</p>
              <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>
                {plan.course} · {plan.examReadinessScore}% exam readiness
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:9, padding:"6px 8px", cursor:"pointer", color:"rgba(255,255,255,0.6)",
              display:"flex" }}>
            <X size={16}/>
          </button>
        </div>

        {/* Subject chips */}
        {subjects.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
            {subjects.map((s, i) => (
              <span key={i} style={{ padding:"3px 12px", borderRadius:99, fontSize:"0.8125rem", fontWeight:600,
                background:`${PALETTE[i % PALETTE.length]}22`, color:PALETTE[i % PALETTE.length],
                border:`1px solid ${PALETTE[i % PALETTE.length]}33` }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Full timetable */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <BookOpen size={14} color="#4895EF"/>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9375rem" }}>
              Daily Timetable ({plan.timetable.length} slots)
            </p>
          </div>
          <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Time</th>
                  <th style={TH}>Subject</th>
                  <th style={TH}>Activity</th>
                  <th style={TH}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {plan.timetable.map((row, i) => {
                  const col = subjectCol(row.subject, subjects);
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)",
                      background: i%2===0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                      <td style={{ padding:"11px 12px", color:"#4895EF", fontWeight:600,
                        fontSize:"0.8125rem", whiteSpace:"nowrap" }}>{row.slot}</td>
                      <td style={{ padding:"11px 12px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:6,
                          padding:"3px 10px", borderRadius:99,
                          background:`${col}22`, color:col, fontWeight:700, fontSize:"0.8125rem",
                          border:`1px solid ${col}33` }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:col }}/>
                          {row.subject}
                        </span>
                      </td>
                      <td style={{ padding:"11px 12px", color:"rgba(255,255,255,0.75)",
                        fontSize:"0.875rem" }}>{row.activity}</td>
                      <td style={{ padding:"11px 12px", color:"rgba(255,255,255,0.4)",
                        fontSize:"0.8125rem", whiteSpace:"nowrap" }}>{row.duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly roadmap */}
        {plan.weeklyRoadmap && plan.weeklyRoadmap.length > 0 && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <Map size={14} color="#52B788"/>
              <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9375rem" }}>Weekly Roadmap</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
              {plan.weeklyRoadmap.map((w, i) => (
                <div key={i} style={{ padding:"14px 14px", borderRadius:12,
                  background:"rgba(82,183,136,0.07)", borderTop:"2px solid #52B788" }}>
                  <p style={{ fontSize:"0.6875rem", fontWeight:700, color:"#52B788",
                    textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{w.week}</p>
                  <p style={{ fontSize:"0.8125rem", fontWeight:700, color:"#fff", marginBottom:8 }}>{w.theme}</p>
                  <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex",
                    flexDirection:"column", gap:4 }}>
                    {w.goals.map((g, gi) => (
                      <li key={gi} style={{ display:"flex", alignItems:"flex-start", gap:6,
                        fontSize:"0.75rem", color:"rgba(255,255,255,0.6)" }}>
                        <div style={{ width:4, height:4, borderRadius:"50%", background:"#52B788",
                          flexShrink:0, marginTop:6 }}/>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Widget
═══════════════════════════════════════════════════════════════ */
export default function PinnedTimetableWidget({ plan, onRemoved }: Props) {
  const [showReview, setShowReview] = useState(false);
  const [showFull,   setShowFull]   = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [removing,   setRemoving]   = useState(false);

  const examDate   = new Date(plan.examDate);
  const daysLeft   = Math.ceil((examDate.getTime() - Date.now()) / 86_400_000);
  const examPassed = daysLeft < 0;
  const subjects   = plan.subjects.split(",").map(s => s.trim()).filter(Boolean);

  const PREVIEW_COUNT = 4;
  const displaySlots  = showAllSlots ? plan.timetable : plan.timetable.slice(0, PREVIEW_COUNT);
  const extraSlots    = plan.timetable.length - PREVIEW_COUNT;

  async function submitReview(rating: number, text: string) {
    setRemoving(true);
    try {
      if (rating > 0 || text.trim()) {
        await fetch("/api/timetable", { method:"PATCH", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ reviewRating:rating, reviewText:text }) });
      }
      await fetch("/api/timetable", { method:"DELETE" });
      toast.success("Study plan removed. Thanks for your feedback!");
      onRemoved();
    } catch { toast.error("Failed to remove plan."); }
    finally { setRemoving(false); setShowReview(false); }
  }

  async function skipAndRemove() {
    setRemoving(true);
    try {
      await fetch("/api/timetable", { method:"DELETE" });
      toast.success("Study plan removed.");
      onRemoved();
    } catch { toast.error("Failed to remove plan."); }
    finally { setRemoving(false); setShowReview(false); }
  }

  return (
    <>
      <AnimatePresence>
        {showReview && (
          <ReviewModal examPassed={examPassed} onSubmit={submitReview} onSkip={skipAndRemove}/>
        )}
        {showFull && (
          <FullPlanModal plan={plan} onClose={() => setShowFull(false)}/>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg,#1F1F1F,#141010)", borderRadius:16,
          padding:20, border:"1px solid rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Calendar size={16} color="#E63946"/>
            <div>
              <p style={{ fontWeight:700, fontSize:"0.9375rem", color:"#fff" }}>📌 Active Study Plan</p>
              <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>{plan.course}</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ padding:"4px 10px", borderRadius:99, fontSize:"0.75rem", fontWeight:700,
              background: examPassed ? "rgba(230,57,70,0.15)" : daysLeft<=3 ? "rgba(230,57,70,0.15)" : "rgba(82,183,136,0.15)",
              color: examPassed ? "#E63946" : daysLeft<=3 ? "#E63946" : "#52B788" }}>
              {examPassed ? "Exam passed!" : `${daysLeft}d left`}
            </div>
            <button onClick={() => setShowReview(true)} disabled={removing} title="Remove plan"
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:8, padding:"5px 7px", cursor:"pointer", color:"rgba(255,255,255,0.45)",
                display:"flex" }}>
              <PinOff size={13}/>
            </button>
          </div>
        </div>

        {/* Today's schedule */}
        <p style={{ fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.07em",
          textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>
          <Clock size={10} style={{ display:"inline", marginRight:5 }}/>Today&apos;s Schedule
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
          <AnimatePresence initial={false}>
            {displaySlots.map((row, i) => {
              const col = subjectCol(row.subject, subjects);
              return (
                <motion.div key={i}
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                  exit={{ opacity:0, height:0 }} transition={{ duration:0.15 }}
                  style={{ overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px",
                    background:"rgba(255,255,255,0.04)", borderRadius:9 }}>
                    <span style={{ fontSize:"0.75rem", color:"#4895EF", fontWeight:600,
                      whiteSpace:"nowrap", minWidth:100 }}>{row.slot}</span>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:col, flexShrink:0 }}/>
                    <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"#fff", flex:1 }}>
                      {row.subject}
                    </span>
                    <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.35)" }}>{row.duration}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Expandable "+N more" */}
          {extraSlots > 0 && (
            <button onClick={() => setShowAllSlots(v => !v)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                padding:"6px 0", background:"none", border:"1px dashed rgba(255,255,255,0.12)",
                borderRadius:8, cursor:"pointer", color:"rgba(255,255,255,0.45)",
                fontSize:"0.75rem", fontWeight:600, transition:"all 0.15s" }}>
              {showAllSlots
                ? <><ChevronUp size={12}/> Show less</>
                : <><ChevronDown size={12}/> +{extraSlots} more slots</>}
            </button>
          )}
        </div>

        {/* Readiness + CTA */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ height:6, width:80, borderRadius:99,
              background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:99, width:`${plan.examReadinessScore}%`,
                background: plan.examReadinessScore>=75?"#52B788":plan.examReadinessScore>=50?"#D4A373":"#E63946" }}/>
            </div>
            <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>
              {plan.examReadinessScore}% ready
            </span>
          </div>

          {/* View Full Plan — opens modal, not navigate away */}
          <button onClick={() => setShowFull(true)}
            style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
              cursor:"pointer", color:"#9B5DE5", fontWeight:600, fontSize:"0.8125rem",
              padding:0, textDecoration:"none" }}>
            <ExternalLink size={12}/> View Full Plan
          </button>
        </div>
      </motion.div>
    </>
  );
}
