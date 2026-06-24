"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Pencil, Trash2, Clock, BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface StudySession { _id:string; subject:string; duration:number; date:string; notes?:string; completed:boolean; }
interface SessionListProps { sessions:StudySession[]; onEdit:(s:StudySession)=>void; onRefresh:()=>void; }

const SUBJECT_COLORS: Record<string,string> = {
  Mathematics:"#E63946", Physics:"#4895EF", Chemistry:"#52B788", Biology:"#F4A261",
  English:"#9B5DE5", History:"#D4A373", Computer:"#E9C46A", Geography:"#2A9D8F",
};

function getColor(subject: string) {
  return SUBJECT_COLORS[subject] || "#6B6B6B";
}

export default function SessionList({ sessions, onEdit, onRefresh }: SessionListProps) {
  const [expanded, setExpanded] = useState<string|null>(null);
  const visible = sessions.slice(0,12);

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;
    const res = await fetch(`/api/sessions/${id}`,{method:"DELETE"});
    if (res.ok) { toast.success("Session deleted."); onRefresh(); }
    else toast.error("Failed to delete session.");
  }

  return (
    <div className="card" style={{ padding:0 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <BookOpen size={16} color="var(--ruby)" />
          <h3 className="t-h3" style={{ color:"var(--text-primary)" }}>Recent Sessions</h3>
        </div>
        <span className="badge badge-ruby">{sessions.length}</span>
      </div>

      <div className="divider" />

      {/* Table header */}
      {sessions.length > 0 && (
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 80px 90px 72px",
          padding:"8px 20px", gap:8,
        }}>
          {["Subject","Duration","Date",""].map(h=>(
            <span key={h} className="t-caption" style={{ color:"var(--text-tertiary)" }}>{h}</span>
          ))}
        </div>
      )}

      {/* Rows */}
      {sessions.length === 0 ? (
        <div style={{ padding:"48px 20px", textAlign:"center" }}>
          <p style={{ fontSize:"2.5rem", marginBottom:8 }}>📚</p>
          <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)" }}>No sessions yet</p>
          <p style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)", marginTop:4 }}>Log your first session to get started!</p>
        </div>
      ) : (
        <div style={{ padding:"0 0 8px" }}>
          <AnimatePresence>
            {visible.map((s,i) => (
              <motion.div
                key={s._id}
                initial={{ opacity:0, x:-8 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:8 }}
                transition={{ delay:i*0.03 }}
                layout
              >
                {/* Row */}
                <div
                  style={{
                    display:"grid", gridTemplateColumns:"1fr 80px 90px 72px",
                    alignItems:"center", padding:"10px 20px", gap:8,
                    cursor:"pointer", transition:"background var(--t-fast)",
                    borderBottom:"1px solid var(--border)",
                  }}
                  className="hover:bg-cream"
                  onClick={()=>setExpanded(expanded===s._id?null:s._id)}
                >
                  {/* Subject */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:getColor(s.subject), flexShrink:0 }}/>
                    <span style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {s.subject}
                    </span>
                  </div>

                  {/* Duration */}
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <Clock size={11} color="var(--text-tertiary)"/>
                    <span style={{ fontSize:"0.8125rem", color:"var(--text-secondary)" }}>{s.duration}m</span>
                  </div>

                  {/* Date */}
                  <span style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)" }}>
                    {format(new Date(s.date),"MMM d")}
                  </span>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:2, justifyContent:"flex-end" }}
                    onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>onEdit(s)} className="btn btn-ghost btn-icon btn-sm" style={{ color:"#4895EF" }}>
                      <Pencil size={13}/>
                    </button>
                    <button onClick={()=>handleDelete(s._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color:"var(--ruby)" }}>
                      <Trash2 size={13}/>
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color:"var(--text-tertiary)" }}>
                      <ChevronDown size={13} style={{ transform:expanded===s._id?"rotate(180deg)":"rotate(0)", transition:"transform var(--t-fast)" }}/>
                    </button>
                  </div>
                </div>

                {/* Expanded notes */}
                <AnimatePresence>
                  {expanded===s._id && s.notes && (
                    <motion.div
                      initial={{ height:0, opacity:0 }}
                      animate={{ height:"auto", opacity:1 }}
                      exit={{ height:0, opacity:0 }}
                      style={{ overflow:"hidden", background:"var(--cream)", padding:"10px 20px 10px 36px" }}
                    >
                      <p style={{ fontSize:"0.8125rem", color:"var(--text-secondary)", lineHeight:1.5 }}>
                        📝 {s.notes}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {sessions.length > 12 && (
            <div style={{ padding:"12px 20px", textAlign:"center" }}>
              <span style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)" }}>
                + {sessions.length-12} more sessions
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
