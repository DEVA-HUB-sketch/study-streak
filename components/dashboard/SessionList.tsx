"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { Pencil, Trash2, Clock, BookOpen, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface StudySession { _id:string; subject:string; duration:number; date:string; notes?:string; completed:boolean; }
interface SessionListProps { sessions:StudySession[]; onEdit:(s:StudySession)=>void; onRefresh:()=>void; }

const PALETTE = ["#E63946","#4895EF","#52B788","#F4A261","#9B5DE5","#D4A373","#E9C46A","#2A9D8F"];
function subjectColor(name: string, all: string[]) {
  const idx = all.indexOf(name);
  return PALETTE[(idx < 0 ? Math.abs(name.charCodeAt(0) - 65) : idx) % PALETTE.length];
}

type Filter = "all" | "today" | "week" | "month";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All", today: "Today", week: "This Week", month: "This Month",
};

export default function SessionList({ sessions, onEdit, onRefresh }: SessionListProps) {
  const [expanded, setExpanded] = useState<string|null>(null);
  const [filter,   setFilter]   = useState<Filter>("all");
  const [search,   setSearch]   = useState("");
  const [subject,  setSubject]  = useState("all");
  const [showAll,  setShowAll]  = useState(false);

  const allSubjects = useMemo(()=>[...new Set(sessions.map(s=>s.subject))].sort(),[sessions]);

  const filtered = useMemo(()=>{
    return sessions.filter(s=>{
      const d = new Date(s.date);
      const matchTime =
        filter === "all"   ? true :
        filter === "today" ? isToday(d) :
        filter === "week"  ? isThisWeek(d, { weekStartsOn: 1 }) :
        isThisMonth(d);
      const matchSubject = subject === "all" || s.subject === subject;
      const matchSearch  = !search.trim() || s.subject.toLowerCase().includes(search.toLowerCase()) || (s.notes ?? "").toLowerCase().includes(search.toLowerCase());
      return matchTime && matchSubject && matchSearch;
    });
  },[sessions, filter, subject, search]);

  const visible = showAll ? filtered : filtered.slice(0, 10);

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;
    const res = await fetch(`/api/sessions/${id}`,{method:"DELETE"});
    if (res.ok) { toast.success("Session deleted."); onRefresh(); }
    else toast.error("Failed to delete session.");
  }

  const totalMinutes = filtered.reduce((a,s)=>a+s.duration,0);

  return (
    <div className="card" style={{ padding:0 }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ padding:"16px 20px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <BookOpen size={16} color="var(--ruby)" />
            <h3 className="t-h3" style={{ color:"var(--text-primary)" }}>Sessions</h3>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {totalMinutes > 0 && (
              <span style={{ fontSize:"0.75rem", color:"var(--text-tertiary)" }}>
                {+(totalMinutes/60).toFixed(1)}h total
              </span>
            )}
            <span className="badge badge-ruby">{filtered.length}</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:10 }}>
          <Search size={13} color="var(--text-tertiary)"
            style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}/>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search subject or notes…"
            className="input-base"
            style={{ paddingLeft:30, paddingRight:search?30:12, fontSize:"0.875rem", height:34 }}
          />
          {search && (
            <button onClick={()=>setSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)" }}>
              <X size={13}/>
            </button>
          )}
        </div>

        {/* Time filter chips */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
          {(["all","today","week","month"] as Filter[]).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className="btn btn-sm"
              style={{ background: filter===f ? "var(--ruby)" : "var(--cream)",
                color: filter===f ? "#fff" : "var(--text-secondary)",
                border:`1px solid ${filter===f?"var(--ruby)":"var(--border)"}`,
                fontWeight: filter===f ? 700 : 400, fontSize:"0.75rem", padding:"3px 10px" }}>
              {FILTER_LABELS[f]}
            </button>
          ))}

          {/* Subject filter */}
          {allSubjects.length > 1 && (
            <select value={subject} onChange={e=>setSubject(e.target.value)}
              style={{ fontSize:"0.75rem", padding:"3px 8px", borderRadius:99,
                background: subject!=="all"?"var(--ruby-dim)":"var(--cream)",
                color: subject!=="all"?"var(--ruby)":"var(--text-secondary)",
                border:`1px solid ${subject!=="all"?"var(--ruby)":"var(--border)"}`,
                cursor:"pointer", outline:"none" }}>
              <option value="all">All Subjects</option>
              {allSubjects.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* ── Table header ───────────────────────────────────── */}
      {filtered.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 72px 80px 72px",
          padding:"7px 20px", gap:8 }}>
          {["Subject","Duration","Date",""].map(h=>(
            <span key={h} className="t-caption" style={{ color:"var(--text-tertiary)" }}>{h}</span>
          ))}
        </div>
      )}

      {/* ── Rows ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding:"40px 20px", textAlign:"center" }}>
          <p style={{ fontSize:"2rem", marginBottom:8 }}>📭</p>
          <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)" }}>
            {sessions.length === 0 ? "No sessions yet" : "No sessions match your filter"}
          </p>
          <p style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)", marginTop:4 }}>
            {sessions.length === 0 ? "Log your first session to get started!" : "Try adjusting the filter or search."}
          </p>
        </div>
      ) : (
        <div style={{ paddingBottom:8 }}>
          <AnimatePresence>
            {visible.map((s, i) => {
              const col = subjectColor(s.subject, allSubjects);
              return (
                <motion.div key={s._id}
                  initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:6 }} transition={{ delay:i*0.02 }} layout>

                  <div
                    style={{ display:"grid", gridTemplateColumns:"1fr 72px 80px 72px",
                      alignItems:"center", padding:"9px 20px", gap:8,
                      cursor:"pointer", transition:"background var(--t-fast)",
                      borderBottom:"1px solid var(--border)" }}
                    className="hover:bg-cream"
                    onClick={()=>setExpanded(expanded===s._id?null:s._id)}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:col, flexShrink:0 }}/>
                      <span style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {s.subject}
                      </span>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <Clock size={10} color="var(--text-tertiary)"/>
                      <span style={{ fontSize:"0.8125rem", color:"var(--text-secondary)" }}>{s.duration}m</span>
                    </div>

                    <span style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)" }}>
                      {format(new Date(s.date),"MMM d, yy")}
                    </span>

                    <div style={{ display:"flex", gap:2, justifyContent:"flex-end" }}
                      onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>onEdit(s)} className="btn btn-ghost btn-icon btn-sm" style={{ color:"#4895EF" }}>
                        <Pencil size={12}/>
                      </button>
                      <button onClick={()=>handleDelete(s._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color:"var(--ruby)" }}>
                        <Trash2 size={12}/>
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color:"var(--text-tertiary)" }}>
                        <ChevronDown size={12} style={{ transform:expanded===s._id?"rotate(180deg)":"rotate(0)", transition:"transform var(--t-fast)" }}/>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded===s._id && s.notes && (
                      <motion.div
                        initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
                        style={{ overflow:"hidden", background:"var(--cream)", padding:"9px 20px 9px 36px",
                          borderBottom:"1px solid var(--border)" }}>
                        <p style={{ fontSize:"0.8125rem", color:"var(--text-secondary)", lineHeight:1.55 }}>📝 {s.notes}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length > 10 && (
            <div style={{ padding:"10px 20px", textAlign:"center" }}>
              <button onClick={()=>setShowAll(v=>!v)}
                style={{ fontSize:"0.8125rem", color:"var(--ruby)", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>
                {showAll ? "Show less ↑" : `Show all ${filtered.length} sessions ↓`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
