"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ExternalLink, PinOff, Star, X } from "lucide-react";
import Link from "next/link";
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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:60, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        style={{ background:"var(--warm-white)", borderRadius:20, padding:28, maxWidth:420, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>

        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:"2.5rem", marginBottom:10 }}>{examPassed ? "🎉" : "📝"}</div>
          <h2 style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.03em", color:"var(--text-primary)", marginBottom:6 }}>
            {examPassed ? "How did your exam go?" : "Remove your study plan?"}
          </h2>
          <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.6 }}>
            {examPassed
              ? "Your exam date has passed! Share your experience to help us improve your next study plan."
              : "Before removing, would you like to rate how helpful this plan was?"}
          </p>
        </div>

        {/* Star rating */}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:16 }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} type="button"
              onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(s)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              <Star size={28} fill={(hover||rating)>=s ? "#D4A373" : "none"} color={(hover||rating)>=s ? "#D4A373" : "var(--border-strong)"}/>
            </button>
          ))}
        </div>

        {/* Feedback text */}
        <textarea
          value={text} onChange={e=>setText(e.target.value)} rows={3}
          placeholder="How accurate was the timetable? What would you improve?"
          className="input-base" style={{ width:"100%", resize:"none", marginBottom:16, fontSize:"0.875rem" }}
        />

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>onSubmit(rating, text)}
            className="btn btn-primary" style={{ flex:1 }}>
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

/* ── Widget ─────────────────────────────────────────────────── */
const PALETTE = ["#E63946","#4895EF","#52B788","#D4A373","#9B5DE5","#F4A261","#2A9D8F","#E9C46A"];

export default function PinnedTimetableWidget({ plan, onRemoved }: Props) {
  const [showReview, setShowReview] = useState(false);
  const [removing,   setRemoving]   = useState(false);

  const examDate  = new Date(plan.examDate);
  const daysLeft  = Math.ceil((examDate.getTime() - Date.now()) / 86_400_000);
  const examPassed = daysLeft < 0;

  /* today's slots — show first 4 */
  const todaySlots = plan.timetable.slice(0, 4);
  const subjects   = plan.subjects.split(",").map(s=>s.trim()).filter(Boolean);

  function subjectCol(name: string) {
    const i = subjects.indexOf(name);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  }

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
      </AnimatePresence>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg,#1F1F1F,#141010)", borderRadius:16, padding:20, border:"1px solid rgba(255,255,255,0.08)" }}>

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
            {/* Countdown chip */}
            <div style={{ padding:"4px 10px", borderRadius:99, fontSize:"0.75rem", fontWeight:700,
              background: examPassed ? "rgba(230,57,70,0.15)" : daysLeft<=3 ? "rgba(230,57,70,0.15)" : "rgba(82,183,136,0.15)",
              color:      examPassed ? "#E63946"                : daysLeft<=3 ? "#E63946"                : "#52B788" }}>
              {examPassed ? "Exam passed!" : `${daysLeft}d left`}
            </div>
            <button onClick={()=>setShowReview(true)} disabled={removing} title="Remove plan"
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"5px 7px", cursor:"pointer", color:"rgba(255,255,255,0.45)", display:"flex" }}>
              <PinOff size={13}/>
            </button>
          </div>
        </div>

        {/* Today's schedule */}
        <p style={{ fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>
          <Clock size={10} style={{ display:"inline", marginRight:5 }}/>Today&apos;s Schedule
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
          {todaySlots.map((row, i) => {
            const col = subjectCol(row.subject);
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", background:"rgba(255,255,255,0.04)", borderRadius:9 }}>
                <span style={{ fontSize:"0.75rem", color:"#4895EF", fontWeight:600, whiteSpace:"nowrap", minWidth:100 }}>{row.slot}</span>
                <span style={{ width:8, height:8, borderRadius:"50%", background:col, flexShrink:0 }}/>
                <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"#fff", flex:1 }}>{row.subject}</span>
                <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.35)" }}>{row.duration}</span>
              </div>
            );
          })}
          {plan.timetable.length > 4 && (
            <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.3)", textAlign:"center", paddingTop:4 }}>
              +{plan.timetable.length - 4} more slots
            </p>
          )}
        </div>

        {/* Readiness + CTA */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ height:6, width:80, borderRadius:99, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:99, width:`${plan.examReadinessScore}%`,
                background: plan.examReadinessScore>=75?"#52B788":plan.examReadinessScore>=50?"#D4A373":"#E63946" }}/>
            </div>
            <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>{plan.examReadinessScore}% ready</span>
          </div>
          <Link href="/ai" style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.8125rem", color:"#9B5DE5", fontWeight:600, textDecoration:"none" }}>
            <ExternalLink size={12}/> View Full Plan
          </Link>
        </div>
      </motion.div>
    </>
  );
}
