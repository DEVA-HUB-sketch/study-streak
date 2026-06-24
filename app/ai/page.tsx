"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Sparkles, BookOpen, Target, Clock, Trophy,
  ChevronDown, ChevronUp, Zap, Calendar, Brain, Star,
  Pin, PinOff, Send, MessageCircle, X, User,
  AlertTriangle, TrendingUp, BarChart2, Lightbulb, CheckCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import toast, { Toaster } from "react-hot-toast";
import type { AIStudyPlan } from "@/app/api/ai/route";

/* ── Subject colour palette ─────────────────────────────────── */
const PALETTE = [
  { bg:"#E63946", light:"rgba(230,57,70,0.12)",  pill:"rgba(230,57,70,0.2)"  },
  { bg:"#4895EF", light:"rgba(72,149,239,0.12)",  pill:"rgba(72,149,239,0.2)"  },
  { bg:"#52B788", light:"rgba(82,183,136,0.12)",  pill:"rgba(82,183,136,0.2)"  },
  { bg:"#D4A373", light:"rgba(212,163,115,0.12)", pill:"rgba(212,163,115,0.2)" },
  { bg:"#9B5DE5", light:"rgba(155,93,229,0.12)",  pill:"rgba(155,93,229,0.2)"  },
  { bg:"#F4A261", light:"rgba(244,162,97,0.12)",  pill:"rgba(244,162,97,0.2)"  },
  { bg:"#2A9D8F", light:"rgba(42,157,143,0.12)",  pill:"rgba(42,157,143,0.2)"  },
  { bg:"#E9C46A", light:"rgba(233,196,106,0.12)", pill:"rgba(233,196,106,0.2)" },
];

function subjectColor(name: string, all: string[]) {
  const idx = all.indexOf(name);
  return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
}

/* ── Score ring ─────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#52B788" : score >= 50 ? "#D4A373" : "#E63946";
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={124} height={124} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={62} cy={62} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8}/>
        <motion.circle cx={62} cy={62} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          initial={{ strokeDasharray:`0 ${circ}` }}
          animate={{ strokeDasharray:`${(score/100)*circ} ${circ}` }}
          transition={{ duration:1.2, ease:"easeOut" }}/>
      </svg>
      <div style={{ position:"absolute", textAlign:"center" }}>
        <p style={{ fontSize:"2rem", fontWeight:900, color, lineHeight:1 }}>{score}</p>
        <p style={{ fontSize:"0.625rem", color:"rgba(255,255,255,0.4)", marginTop:2 }}>/&nbsp;100</p>
      </div>
    </div>
  );
}

/* ── Priority badge ─────────────────────────────────────────── */
function Priority({ p }: { p: string }) {
  const m: Record<string,{bg:string;c:string}> = {
    High:{bg:"rgba(230,57,70,0.2)",c:"#E63946"}, Medium:{bg:"rgba(212,163,115,0.2)",c:"#D4A373"}, Low:{bg:"rgba(82,183,136,0.2)",c:"#52B788"},
  };
  const s = m[p] ?? m.Medium;
  return <span style={{ fontSize:"0.6875rem", fontWeight:700, padding:"2px 8px", borderRadius:99, background:s.bg, color:s.c }}>{p}</span>;
}

/* ── Section card (dark) ────────────────────────────────────── */
function Section({ title, icon, children, defaultOpen=true }: { title:string; icon:React.ReactNode; children:React.ReactNode; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, overflow:"hidden" }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"13px 16px", background:"none", border:"none", cursor:"pointer" }}>
        <span style={{ width:28, height:28, borderRadius:8, background:"rgba(230,57,70,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</span>
        <span style={{ flex:1, textAlign:"left", fontWeight:700, fontSize:"0.9375rem", color:"#fff" }}>{title}</span>
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.35)"/> : <ChevronDown size={14} color="rgba(255,255,255,0.35)"/>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 16px 16px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Colourful timetable ────────────────────────────────────── */
function Timetable({ rows, allSubjects }: { rows: AIStudyPlan["timetable"]; allSubjects: string[] }) {
  const TH = { padding:"10px 14px", textAlign:"left" as const, fontSize:"0.6875rem", fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.07em", textTransform:"uppercase" as const, background:"rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.07)" };
  return (
    <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)" }}>
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
          {rows.map((row, i) => {
            const c = subjectColor(row.subject, allSubjects);
            return (
              <tr key={i} style={{ background: i%2===0 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom:"1px solid rgba(255,255,255,0.05)", transition:"background 0.15s" }}>
                <td style={{ padding:"12px 14px", color:"#4895EF", fontWeight:600, fontSize:"0.8125rem", whiteSpace:"nowrap" }}>{row.slot}</td>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99, background:c.pill, color:c.bg, fontWeight:700, fontSize:"0.8125rem", border:`1px solid ${c.light}` }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:c.bg, flexShrink:0 }}/>
                    {row.subject}
                  </span>
                </td>
                <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.75)", fontSize:"0.875rem", lineHeight:1.4 }}>{row.activity}</td>
                <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.4)", fontSize:"0.8125rem", whiteSpace:"nowrap" }}>{row.duration}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Chat bubble ────────────────────────────────────────────── */
function Bubble({ role, content }: { role:"user"|"assistant"; content:string }) {
  const isUser = role === "user";
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
        background: isUser ? "linear-gradient(135deg,#E63946,#C1121F)" : "rgba(155,93,229,0.2)" }}>
        {isUser ? <User size={13} color="#fff"/> : <Bot size={13} color="#9B5DE5"/>}
      </div>
      <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isUser ? "rgba(230,57,70,0.2)" : "rgba(255,255,255,0.07)",
        color:"rgba(255,255,255,0.9)", fontSize:"0.875rem", lineHeight:1.65, whiteSpace:"pre-wrap" }}>
        {content || <span style={{ opacity:0.4 }}>●●●</span>}
      </div>
    </div>
  );
}

/* ── Form field ─────────────────────────────────────────────── */
function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
const INP = { className:"input-base", style:{ background:"var(--cream)", fontSize:"0.9375rem" } as React.CSSProperties };

/* ── Chat message type ──────────────────────────────────────── */
interface ChatMsg { role:"user"|"assistant"; content:string; }

/* ═══════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════ */
export default function AICoachPage() {
  const { user } = useCurrentUser();

  /* plan form */
  const [form, setForm] = useState({ course:"", year:"", subjects:"", weakSubjects:"", strongSubjects:"", examDate:"", studyHours:"6" });
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<AIStudyPlan | null>(null);
  const [planErr,  setPlanErr]  = useState("");
  const [pinned,   setPinned]   = useState(false);
  const [pinSaving,setPinSaving]= useState(false);

  /* chat */
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState<ChatMsg[]>([]);
  const [chatInput,  setChatInput]  = useState("");
  const [chatLoading,setChatLoading]= useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setForm(f=>({...f,[k]:e.target.value}));

  /* unique subject list for colour mapping */
  const allSubjects = form.subjects.split(",").map(s=>s.trim()).filter(Boolean);

  /* ── Generate plan ──────────────────────────────────────── */
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault(); setPlanErr(""); setResult(null); setPinned(false); setLoading(true);
    try {
      const res = await fetch("/api/ai", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name:user?.name, ...form }) });
      const data = await res.json();
      if (!res.ok) { setPlanErr(data.error ?? "Something went wrong."); return; }
      setResult(data as AIStudyPlan);
      window.scrollTo({ top: 400, behavior:"smooth" });
    } catch { setPlanErr("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  /* ── Pin to dashboard ───────────────────────────────────── */
  async function handlePin() {
    if (!result) return;
    setPinSaving(true);
    try {
      const res = await fetch("/api/timetable", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, examReadinessScore:result.examReadinessScore, timetable:result.timetable, weeklyRoadmap:result.weeklyRoadmap }) });
      if (res.ok) { setPinned(true); toast.success("📌 Study plan pinned to your Dashboard!"); }
      else toast.error("Failed to pin plan.");
    } catch { toast.error("Network error."); }
    finally { setPinSaving(false); }
  }

  /* ── Chat send ──────────────────────────────────────────── */
  async function handleChatSend() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");

    const newMsgs: ChatMsg[] = [...chatMsgs, { role:"user", content:text }];
    setChatMsgs(newMsgs);
    setChatLoading(true);

    // Add empty assistant slot for streaming
    setChatMsgs(prev => [...prev, { role:"assistant", content:"" }]);

    try {
      const res = await fetch("/api/ai/chat", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: newMsgs.slice(-12), course:form.course, subjects:form.subjects }) });

      if (!res.ok || !res.body) {
        setChatMsgs(prev => [...prev.slice(0,-1), { role:"assistant", content:"Sorry, I couldn't respond. Try again." }]);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setChatMsgs(prev => [...prev.slice(0,-1), { role:"assistant", content }]);
      }
    } catch {
      setChatMsgs(prev => [...prev.slice(0,-1), { role:"assistant", content:"Something went wrong. Please try again." }]);
    } finally {
      setChatLoading(false);
      setTimeout(()=>chatEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    }
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <DashboardLayout user={user}>
      <Toaster position="top-right"/>
      <div style={{ padding:24, maxWidth:900, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#E63946,#9B5DE5)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(230,57,70,0.3)" }}>
              <Bot size={24} color="#fff"/>
            </div>
            <div>
              <h1 style={{ fontSize:"1.375rem", fontWeight:800, letterSpacing:"-0.03em", color:"var(--text-primary)" }}>AI Study Coach</h1>
              <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>Powered by Llama 3.3 · Personalised for you</p>
            </div>
          </div>
          <button onClick={()=>setChatOpen(o=>!o)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:10, border:"1.5px solid rgba(155,93,229,0.4)", background:"rgba(155,93,229,0.08)", color:"#9B5DE5", fontWeight:600, fontSize:"0.875rem", cursor:"pointer" }}>
            <MessageCircle size={15}/> Study Buddy Chat
          </button>
        </div>

        {/* Form */}
        <motion.form onSubmit={handleGenerate} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:16 }}>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Course / Degree *">
              <input {...INP} placeholder="e.g. B.Tech Computer Science" value={form.course} onChange={set("course")} required/>
            </Field>
            <Field label="Current Year">
              <select {...INP} value={form.year} onChange={set("year")}>
                <option value="">Select year</option>
                {["1st Year","2nd Year","3rd Year","4th Year","Postgraduate"].map(y=><option key={y}>{y}</option>)}
              </select>
            </Field>
          </div>

          <Field label="All Subjects (comma-separated) *">
            <textarea {...INP} rows={2} placeholder="e.g. Mathematics, Physics, Chemistry, English, Computer Science"
              value={form.subjects} onChange={set("subjects")} required style={{ ...INP.style, resize:"none" }}/>
          </Field>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Weak Subjects">
              <input {...INP} placeholder="e.g. Mathematics, Physics" value={form.weakSubjects} onChange={set("weakSubjects")}/>
            </Field>
            <Field label="Strong Subjects">
              <input {...INP} placeholder="e.g. Computer Science, English" value={form.strongSubjects} onChange={set("strongSubjects")}/>
            </Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Exam Date *">
              <input type="date" {...INP} value={form.examDate} onChange={set("examDate")} required min={new Date().toISOString().slice(0,10)}/>
            </Field>
            <Field label="Daily Study Hours *">
              <input type="number" {...INP} placeholder="6" min="1" max="16" value={form.studyHours} onChange={set("studyHours")} required/>
            </Field>
          </div>

          {planErr && <p style={{ fontSize:"0.875rem", color:"var(--ruby)", fontWeight:500, padding:"10px 14px", background:"rgba(230,57,70,0.07)", borderRadius:10 }}>{planErr}</p>}

          <motion.button type="submit" disabled={loading} whileHover={!loading?{scale:1.01}:{}} whileTap={!loading?{scale:0.98}:{}}
            className="btn btn-primary" style={{ alignSelf:"flex-start", paddingLeft:28, paddingRight:28, gap:8, fontSize:"0.9375rem" }}>
            {loading
              ? <><span style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> Generating…</>
              : <><Sparkles size={15}/> Generate My Study Plan</>}
          </motion.button>
        </motion.form>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ background:"linear-gradient(135deg,var(--charcoal),#1A1412)", borderRadius:20, padding:44, textAlign:"center" }}>
              <motion.div animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:"linear" }}
                style={{ width:56, height:56, borderRadius:"50%", border:"3px solid rgba(230,57,70,0.2)", borderTopColor:"#E63946", margin:"0 auto 20px" }}/>
              <p style={{ color:"#fff", fontWeight:700, fontSize:"1.0625rem", marginBottom:8 }}>Your AI Coach is thinking…</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.875rem" }}>Building a personalised plan. This takes ~15 seconds.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results — dark container so white text is always visible */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"linear-gradient(160deg,#1F1F1F,#141010)", borderRadius:20, padding:20, display:"flex", flexDirection:"column", gap:14 }}>

              {/* Score + Motivation */}
              <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:24, padding:"20px 20px 16px", background:"rgba(255,255,255,0.03)", borderRadius:14 }}>
                <div style={{ textAlign:"center" }}>
                  <p style={{ fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:12 }}>Exam Readiness</p>
                  <ScoreRing score={result.examReadinessScore}/>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <Zap size={15} color="#D4A373"/>
                    <span style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#D4A373" }}>AI Motivation</span>
                  </div>
                  <p style={{ fontSize:"0.9875rem", color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontStyle:"italic" }}>&ldquo;{result.motivationMessage}&rdquo;</p>
                </div>
              </div>

              {/* Strategy */}
              <div style={{ padding:"14px 18px", background:"rgba(155,93,229,0.08)", border:"1px solid rgba(155,93,229,0.15)", borderRadius:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <Brain size={14} color="#9B5DE5"/>
                  <span style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#9B5DE5" }}>Study Strategy</span>
                </div>
                <p style={{ fontSize:"0.9375rem", color:"rgba(255,255,255,0.8)", lineHeight:1.7 }}>{result.studyStrategy}</p>
              </div>

              {/* Daily Targets */}
              <Section title="Daily Targets" icon={<Target size={14} color="#E63946"/>}>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {result.dailyTargets.map((t, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <div style={{ width:22, height:22, borderRadius:7, background:"rgba(230,57,70,0.15)", border:"1.5px solid rgba(230,57,70,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                        <span style={{ fontSize:"0.6875rem", fontWeight:800, color:"#E63946" }}>{i+1}</span>
                      </div>
                      <p style={{ fontSize:"0.9rem", color:"rgba(255,255,255,0.82)", lineHeight:1.65 }}>{t}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Timetable — colourful table */}
              <Section title="Today's Timetable" icon={<Clock size={14} color="#4895EF"/>}>
                <Timetable rows={result.timetable} allSubjects={allSubjects}/>
                {/* Pin button */}
                <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:10 }}>
                  <button
                    onClick={handlePin}
                    disabled={pinned || pinSaving}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:10,
                      background: pinned ? "rgba(82,183,136,0.15)" : "rgba(230,57,70,0.12)",
                      border: `1.5px solid ${pinned ? "rgba(82,183,136,0.3)" : "rgba(230,57,70,0.3)"}`,
                      color: pinned ? "#52B788" : "#E63946", fontWeight:600, fontSize:"0.875rem",
                      cursor: pinned ? "default" : "pointer", transition:"all 0.2s" }}>
                    {pinned ? <PinOff size={14}/> : <Pin size={14}/>}
                    {pinSaving ? "Pinning…" : pinned ? "Pinned to Dashboard ✓" : "📌 Pin to Dashboard"}
                  </button>
                  {!pinned && <p style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.35)" }}>Save this plan to your home page until exam day</p>}
                </div>
              </Section>

              {/* Subject Methods */}
              <Section title="Subject-wise Study Methods" icon={<BookOpen size={14} color="#D4A373"/>}>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {result.subjectMethods.map((sm, i) => {
                    const c = subjectColor(sm.subject, allSubjects);
                    return (
                      <div key={i} style={{ padding:"14px 16px", background:"rgba(255,255,255,0.04)", borderRadius:12, borderLeft:`3px solid ${c.bg}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                          <span style={{ fontSize:"0.9375rem", fontWeight:700, color:"#fff" }}>{sm.subject}</span>
                          <Priority p={sm.priority}/>
                        </div>
                        <ul style={{ listStyle:"none", padding:0, margin:"0 0 10px", display:"flex", flexDirection:"column", gap:5 }}>
                          {sm.methods.map((m, mi) => (
                            <li key={mi} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:"0.875rem", color:"rgba(255,255,255,0.75)" }}>
                              <Star size={10} color={c.bg} style={{ marginTop:5, flexShrink:0 }}/>{m}
                            </li>
                          ))}
                        </ul>
                        <p style={{ fontSize:"0.8125rem", color:c.bg, fontStyle:"italic" }}>💡 {sm.tip}</p>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Weekly Roadmap */}
              <Section title="Weekly Roadmap" icon={<Calendar size={14} color="#52B788"/>}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12 }}>
                  {result.weeklyRoadmap.map((w, i) => (
                    <div key={i} style={{ padding:"14px 16px", background:"rgba(82,183,136,0.06)", borderRadius:12, borderTop:`2px solid #52B788` }}>
                      <p style={{ fontSize:"0.6875rem", fontWeight:700, color:"#52B788", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{w.week}</p>
                      <p style={{ fontSize:"0.875rem", fontWeight:700, color:"#fff", marginBottom:10 }}>{w.theme}</p>
                      <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:5 }}>
                        {w.goals.map((g, gi) => (
                          <li key={gi} style={{ display:"flex", alignItems:"flex-start", gap:7, fontSize:"0.8125rem", color:"rgba(255,255,255,0.65)" }}>
                            <div style={{ width:5, height:5, borderRadius:"50%", background:"#52B788", flexShrink:0, marginTop:6 }}/>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── Performance Analysis (data-driven) ──────── */}
              {(result.weakSubjectAnalysis || result.strengthAnalysis || result.burnoutStatus) && (
                <Section title="AI Performance Analysis" icon={<BarChart2 size={14} color="#4895EF"/>}>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                    {result.weakSubjectAnalysis && (
                      <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(230,57,70,0.07)", borderLeft:"3px solid #E63946" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                          <AlertTriangle size={13} color="#E63946"/>
                          <span style={{ fontSize:"0.6875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#E63946" }}>Weak Subject Analysis</span>
                        </div>
                        <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.65 }}>{result.weakSubjectAnalysis}</p>
                      </div>
                    )}

                    {result.strengthAnalysis && (
                      <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(82,183,136,0.07)", borderLeft:"3px solid #52B788" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                          <TrendingUp size={13} color="#52B788"/>
                          <span style={{ fontSize:"0.6875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#52B788" }}>Strength Analysis</span>
                        </div>
                        <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.65 }}>{result.strengthAnalysis}</p>
                      </div>
                    )}

                    {result.burnoutStatus && (
                      <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(244,162,97,0.07)", borderLeft:"3px solid #F4A261" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                          <Zap size={13} color="#F4A261"/>
                          <span style={{ fontSize:"0.6875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#F4A261" }}>Burnout Detection</span>
                        </div>
                        <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.65 }}>{result.burnoutStatus}</p>
                      </div>
                    )}

                    {result.productivityInsight && (
                      <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(155,93,229,0.07)", borderLeft:"3px solid #9B5DE5" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                          <Brain size={13} color="#9B5DE5"/>
                          <span style={{ fontSize:"0.6875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#9B5DE5" }}>Productivity Score</span>
                        </div>
                        <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.65 }}>{result.productivityInsight}</p>
                      </div>
                    )}

                  </div>
                </Section>
              )}

              {/* ── Personalized Recommendations ─────────── */}
              {result.personalizedRecommendations && result.personalizedRecommendations.length > 0 && (
                <Section title="Personalized Recommendations" icon={<Lightbulb size={14} color="#D4A373"/>}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {result.personalizedRecommendations.map((rec, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px", background:"rgba(212,163,115,0.06)", borderRadius:10 }}>
                        <CheckCircle size={14} color="#D4A373" style={{ flexShrink:0, marginTop:2 }}/>
                        <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.6 }}>{rec}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Resources */}
              <Section title="Recommended Learning Resources" icon={<Trophy size={14} color="#9B5DE5"/>} defaultOpen={false}>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {result.resources.map((r, i) => {
                    const c = subjectColor(r.subject, allSubjects);
                    return (
                      <div key={i} style={{ padding:"12px 16px", background:"rgba(255,255,255,0.04)", borderRadius:12, borderLeft:`3px solid ${c.bg}` }}>
                        <p style={{ fontSize:"0.875rem", fontWeight:700, color:c.bg, marginBottom:8 }}>{r.subject}</p>
                        <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:5 }}>
                          {r.items.map((item, ii) => (
                            <li key={ii} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:"0.875rem", color:"rgba(255,255,255,0.75)" }}>
                              <span style={{ color:c.bg, flexShrink:0 }}>→</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Regenerate */}
              <div style={{ textAlign:"center", paddingTop:4 }}>
                <button onClick={()=>{setResult(null);setPinned(false);window.scrollTo({top:0,behavior:"smooth"});}}
                  className="btn btn-secondary" style={{ gap:8, color:"rgba(255,255,255,0.7)", borderColor:"rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)" }}>
                  <Sparkles size={14}/> Generate New Plan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Floating Study Buddy Chat ═══════════════════════════ */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity:0, y:24, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:24, scale:0.95 }}
            style={{ position:"fixed", bottom:24, right:24, width:360, height:500, borderRadius:20,
              background:"linear-gradient(160deg,#1F1F1F,#141010)", border:"1px solid rgba(255,255,255,0.1)",
              boxShadow:"0 24px 80px rgba(0,0,0,0.6)", display:"flex", flexDirection:"column", zIndex:50 }}>

            {/* Chat header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#9B5DE5,#4895EF)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Bot size={16} color="#fff"/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, color:"#fff", fontSize:"0.875rem", lineHeight:1.2 }}>Study Buddy</p>
                <p style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.35)" }}>Ask me anything about your subjects</p>
              </div>
              <button onClick={()=>setChatOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:4 }}>
                <X size={16}/>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px", display:"flex", flexDirection:"column", gap:12 }}>
              {chatMsgs.length === 0 && (
                <div style={{ textAlign:"center", padding:"20px 16px" }}>
                  <Bot size={32} color="rgba(155,93,229,0.5)" style={{ margin:"0 auto 12px" }}/>
                  <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.875rem", lineHeight:1.6 }}>
                    Hi {user?.name?.split(" ")[0] ?? "there"}! 👋 Ask me anything about your subjects, exam tips, or study strategies.
                  </p>
                </div>
              )}
              {chatMsgs.map((m, i) => <Bubble key={i} role={m.role} content={m.content}/>)}
              <div ref={chatEndRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8 }}>
              <input
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); handleChatSend(); } }}
                placeholder="Ask your Study Buddy…"
                style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"9px 13px", color:"#fff", fontSize:"0.875rem", outline:"none" }}
              />
              <button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()}
                style={{ width:38, height:38, borderRadius:10, background: chatLoading||!chatInput.trim() ? "rgba(155,93,229,0.2)" : "linear-gradient(135deg,#9B5DE5,#4895EF)",
                  border:"none", cursor: chatLoading||!chatInput.trim() ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Send size={15} color="#fff"/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
