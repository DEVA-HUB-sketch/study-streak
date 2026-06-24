"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Sparkles, CheckCircle, XCircle, ChevronLeft,
  ChevronRight, Trophy, RotateCcw, Clock, BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import toast, { Toaster } from "react-hot-toast";
import type { IQuestion } from "@/models/TestResult";

interface Subject { _id: string; name: string; color: string; icon: string; }
interface HistoryEntry {
  _id: string; subject: string; topic: string; difficulty: string;
  score: number; totalQuestions: number; percentage: number; createdAt: string;
}

type Phase = "form" | "loading" | "test" | "results";

const DIFF_COLORS: Record<string, { bg: string; color: string }> = {
  Easy:   { bg:"rgba(82,183,136,0.12)",  color:"#52B788" },
  Medium: { bg:"rgba(212,163,115,0.12)", color:"#D4A373" },
  Hard:   { bg:"rgba(230,57,70,0.12)",   color:"#E63946" },
};

/* ── Score ring ─────────────────────────────────────────────── */
function ScoreRing({ pct }: { pct: number }) {
  const r    = 46; const circ = 2 * Math.PI * r;
  const color= pct>=70?"#52B788":pct>=40?"#D4A373":"#E63946";
  const label= pct>=70?"Excellent!":pct>=40?"Good effort":"Keep practising";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
        <svg width={108} height={108} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={54} cy={54} r={r} fill="none" stroke="var(--border)" strokeWidth={8}/>
          <motion.circle cx={54} cy={54} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
            initial={{ strokeDasharray:`0 ${circ}` }}
            animate={{ strokeDasharray:`${(pct/100)*circ} ${circ}` }}
            transition={{ duration:1.2, ease:"easeOut" }}/>
        </svg>
        <div style={{ position:"absolute", textAlign:"center" }}>
          <p style={{ fontSize:"1.5rem", fontWeight:900, color, lineHeight:1 }}>{pct}%</p>
        </div>
      </div>
      <p style={{ fontSize:"0.875rem", fontWeight:700, color }}>{label}</p>
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

/* ═══════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════ */
export default function ChallengesPage() {
  const { user } = useCurrentUser();

  const [phase,     setPhase]     = useState<Phase>("form");
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [form,      setForm]      = useState({ subject:"", topic:"", difficulty:"Medium", count:"10" });
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [answers,   setAnswers]   = useState<(number|undefined)[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [error,     setError]     = useState("");
  const [meta,      setMeta]      = useState({ subject:"", topic:"", difficulty:"" });

  useEffect(() => {
    fetch("/api/subjects").then(r=>r.ok?r.json():null).then(d=>{ if(Array.isArray(d)) setSubjects(d); });
    fetch("/api/challenges/history").then(r=>r.ok?r.json():null).then(d=>{ if(Array.isArray(d)) setHistory(d); });
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
      setForm(f=>({...f,[k]:e.target.value}));

  /* ── Generate test ─────────────────────────────────────────── */
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.topic.trim()) { setError("Subject and topic are required."); return; }
    setError(""); setPhase("loading");
    try {
      const res = await fetch("/api/challenges/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, count: Number(form.count) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed."); setPhase("form"); return; }
      setQuestions(data.questions);
      setAnswers(Array(data.questions.length).fill(undefined));
      setMeta({ subject: form.subject, topic: form.topic, difficulty: form.difficulty });
      setCurrent(0);
      setPhase("test");
    } catch { setError("Network error. Please try again."); setPhase("form"); }
  }

  /* ── Submit test ───────────────────────────────────────────── */
  async function handleSubmit() {
    const withAnswers = questions.map((q, i) => ({ ...q, userAnswer: answers[i] }));
    setQuestions(withAnswers);
    setPhase("results");

    // Save result
    try {
      await fetch("/api/challenges/generate", {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...meta, questions: withAnswers }),
      });
      // Refresh history
      const r = await fetch("/api/challenges/history");
      if (r.ok) { const d = await r.json(); if(Array.isArray(d)) setHistory(d); }
      toast.success("Result saved!");
    } catch { /* silent */ }
  }

  function restart() { setPhase("form"); setQuestions([]); setAnswers([]); setCurrent(0); }

  /* ── Derived ───────────────────────────────────────────────── */
  const answered  = answers.filter(a => a !== undefined).length;
  const score     = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const pct       = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const diffStyle = DIFF_COLORS[form.difficulty] ?? DIFF_COLORS.Medium;

  return (
    <DashboardLayout user={user}>
      <Toaster position="top-right"/>
      <div style={{ padding:24, maxWidth:860, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#E63946,#D4A373)",
            display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(230,57,70,0.3)" }}>
            <Target size={24} color="#fff"/>
          </div>
          <div>
            <h1 style={{ fontSize:"1.375rem", fontWeight:800, letterSpacing:"-0.03em", color:"var(--text-primary)" }}>
              AI Test Generator
            </h1>
            <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>
              Powered by Llama 3.3 · MCQ tests for any subject and topic
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            PHASE: Form
        ══════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {phase === "form" && (
            <motion.div key="form" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <form onSubmit={handleGenerate}
                style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:20, padding:24,
                  display:"flex", flexDirection:"column", gap:16 }}>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <Field label="Subject *">
                    {subjects.length > 0 ? (
                      <select {...INP} value={form.subject} onChange={set("subject")} required>
                        <option value="">Choose subject…</option>
                        {subjects.map(s=><option key={s._id} value={s.name}>{s.icon} {s.name}</option>)}
                        <option value="__custom">+ Enter manually</option>
                      </select>
                    ) : (
                      <input {...INP} value={form.subject} onChange={set("subject")} required
                        placeholder="e.g. Data Structures"/>
                    )}
                    {form.subject === "__custom" && (
                      <input {...INP} style={{ ...INP.style, marginTop:8 }}
                        placeholder="Enter subject name" autoFocus
                        onChange={e=>setForm(f=>({...f,subject:e.target.value}))} required/>
                    )}
                  </Field>

                  <Field label="Topic *">
                    <input {...INP} value={form.topic} onChange={set("topic")} required
                      placeholder="e.g. Binary Trees, SQL Joins, Pointers"/>
                  </Field>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <Field label="Difficulty">
                    <div style={{ display:"flex", gap:8 }}>
                      {["Easy","Medium","Hard"].map(d=>(
                        <button key={d} type="button"
                          onClick={()=>setForm(f=>({...f,difficulty:d}))}
                          style={{ flex:1, padding:"8px 0", borderRadius:10, fontWeight:600, fontSize:"0.875rem",
                            cursor:"pointer", transition:"all 0.15s",
                            background: form.difficulty===d ? DIFF_COLORS[d].bg : "var(--warm-white)",
                            color: form.difficulty===d ? DIFF_COLORS[d].color : "var(--text-secondary)",
                            border:`1.5px solid ${form.difficulty===d ? DIFF_COLORS[d].color : "var(--border)"}` }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Number of Questions">
                    <div style={{ display:"flex", gap:8 }}>
                      {["5","10","15"].map(n=>(
                        <button key={n} type="button"
                          onClick={()=>setForm(f=>({...f,count:n}))}
                          style={{ flex:1, padding:"8px 0", borderRadius:10, fontWeight:700, fontSize:"0.9375rem",
                            cursor:"pointer", transition:"all 0.15s",
                            background: form.count===n ? "rgba(230,57,70,0.1)" : "var(--warm-white)",
                            color: form.count===n ? "var(--ruby)" : "var(--text-secondary)",
                            border:`1.5px solid ${form.count===n ? "var(--ruby)" : "var(--border)"}` }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {error && <p style={{ fontSize:"0.875rem", color:"var(--ruby)", padding:"10px 14px",
                  background:"rgba(230,57,70,0.07)", borderRadius:10 }}>{error}</p>}

                <motion.button type="submit"
                  whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                  className="btn btn-primary"
                  style={{ alignSelf:"flex-start", paddingLeft:28, paddingRight:28, gap:8, fontSize:"0.9375rem" }}>
                  <Sparkles size={15}/> Generate Test
                </motion.button>
              </form>

              {/* History */}
              {history.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <p style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                    <Clock size={14}/> Recent Tests
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {history.slice(0,6).map(h=>{
                      const c = h.percentage>=70?"#52B788":h.percentage>=40?"#D4A373":"#E63946";
                      const dc = DIFF_COLORS[h.difficulty] ?? DIFF_COLORS.Medium;
                      return (
                        <div key={h._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
                          background:"var(--cream)", border:"1px solid var(--border)", borderRadius:12 }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:`${c}15`,
                            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Trophy size={16} color={c}/>
                          </div>
                          <div style={{ flex:1 }}>
                            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.875rem" }}>
                              {h.subject} — {h.topic}
                            </p>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                              <span style={{ fontSize:"0.6875rem", padding:"1px 7px", borderRadius:99,
                                background:dc.bg, color:dc.color, fontWeight:600 }}>{h.difficulty}</span>
                              <span style={{ fontSize:"0.75rem", color:"var(--text-tertiary)" }}>
                                {h.score}/{h.totalQuestions} questions
                              </span>
                            </div>
                          </div>
                          <span style={{ fontWeight:800, fontSize:"1rem", color:c }}>{h.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════
              PHASE: Loading
          ════════════════════════════════════════════════════ */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ background:"linear-gradient(135deg,var(--charcoal),#1A1412)", borderRadius:20,
                padding:56, textAlign:"center" }}>
              <motion.div animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:"linear" }}
                style={{ width:56, height:56, borderRadius:"50%", border:"3px solid rgba(230,57,70,0.2)",
                  borderTopColor:"#E63946", margin:"0 auto 20px" }}/>
              <p style={{ color:"#fff", fontWeight:700, fontSize:"1rem", marginBottom:6 }}>
                Generating your {form.count}-question test…
              </p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.875rem" }}>
                {form.subject} · {form.topic} · {form.difficulty}
              </p>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════
              PHASE: Test taking
          ════════════════════════════════════════════════════ */}
          {phase === "test" && questions.length > 0 && (
            <motion.div key="test" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              {/* Progress header */}
              <div style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:16, padding:"16px 20px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:"0.8125rem", fontWeight:700, color:"var(--text-primary)" }}>
                      Question {current + 1} of {questions.length}
                    </span>
                    <span style={{ fontSize:"0.6875rem", padding:"2px 8px", borderRadius:99,
                      background: diffStyle.bg, color: diffStyle.color, fontWeight:700 }}>{meta.difficulty}</span>
                  </div>
                  <span style={{ fontSize:"0.8125rem", color:"var(--text-secondary)" }}>
                    {answered} answered
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height:6, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
                  <motion.div style={{ height:"100%", borderRadius:99, background:"var(--ruby)" }}
                    animate={{ width:`${((current+1)/questions.length)*100}%` }}
                    transition={{ duration:0.3 }}/>
                </div>
                {/* Question dots */}
                <div style={{ display:"flex", gap:4, marginTop:10, flexWrap:"wrap" }}>
                  {questions.map((_, i) => (
                    <button key={i} onClick={()=>setCurrent(i)}
                      style={{ width:24, height:24, borderRadius:8, border:"none", cursor:"pointer", fontSize:"0.6875rem", fontWeight:700,
                        background: answers[i]!==undefined ? "var(--ruby)" : i===current ? "rgba(230,57,70,0.2)" : "var(--warm-white)",
                        color: answers[i]!==undefined ? "#fff" : i===current ? "var(--ruby)" : "var(--text-tertiary)",
                        outline: i===current ? "2px solid var(--ruby)" : "none",
                        transition:"all 0.15s" }}>
                      {i+1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question card */}
              <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.2 }}
                  style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:16, padding:24, marginBottom:16 }}>
                  <p style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-primary)", lineHeight:1.65, marginBottom:20 }}>
                    Q{current+1}. {questions[current].question}
                  </p>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {questions[current].options.map((opt, oi) => {
                      const selected = answers[current] === oi;
                      return (
                        <motion.button key={oi} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                          onClick={()=>{ const a=[...answers]; a[current]=oi; setAnswers(a); }}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12,
                            textAlign:"left", cursor:"pointer", transition:"all 0.15s",
                            background: selected ? "rgba(230,57,70,0.08)" : "var(--warm-white)",
                            border:`1.5px solid ${selected ? "var(--ruby)" : "var(--border)"}` }}>
                          <span style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.875rem",
                            background: selected ? "var(--ruby)" : "var(--cream)",
                            color: selected ? "#fff" : "var(--text-tertiary)" }}>
                            {["A","B","C","D"][oi]}
                          </span>
                          <span style={{ fontSize:"0.9375rem", color:"var(--text-primary)", lineHeight:1.5 }}>{opt}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button onClick={()=>setCurrent(c=>Math.max(c-1,0))} disabled={current===0}
                  className="btn btn-secondary" style={{ gap:6, opacity:current===0?0.4:1 }}>
                  <ChevronLeft size={15}/> Previous
                </button>

                {current < questions.length - 1 ? (
                  <button onClick={()=>setCurrent(c=>c+1)} className="btn btn-primary" style={{ gap:6 }}>
                    Next <ChevronRight size={15}/>
                  </button>
                ) : (
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={handleSubmit} className="btn btn-primary"
                    style={{ gap:8, background:"linear-gradient(135deg,#E63946,#D4A373)" }}>
                    <Trophy size={15}/> Submit Test ({answered}/{questions.length} answered)
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════
              PHASE: Results
          ════════════════════════════════════════════════════ */}
          {phase === "results" && (
            <motion.div key="results" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              {/* Score card */}
              <div style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:20, padding:28, marginBottom:16 }}>
                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:24, marginBottom:20 }}>
                  <ScoreRing pct={pct}/>
                  <div>
                    <p style={{ fontSize:"1.5rem", fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.02em" }}>
                      {score} / {questions.length} Correct
                    </p>
                    <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:10 }}>
                      {meta.subject} · {meta.topic} · {meta.difficulty}
                    </p>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={restart} className="btn btn-primary" style={{ gap:6 }}>
                        <RotateCcw size={13}/> New Test
                      </button>
                      <button onClick={()=>{ setAnswers(Array(questions.length).fill(undefined)); setCurrent(0); setPhase("test"); }}
                        className="btn btn-secondary" style={{ gap:6 }}>
                        <BookOpen size={13}/> Retry Same
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    { label:"Correct",   value:score,                        color:"#52B788" },
                    { label:"Wrong",     value:questions.length - score,     color:"#E63946" },
                    { label:"Skipped",   value:questions.length - answered,  color:"#D4A373" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign:"center", padding:"10px 0", borderRadius:12,
                      background:`${color}10`, border:`1px solid ${color}22` }}>
                      <p style={{ fontSize:"1.5rem", fontWeight:900, color }}>{value}</p>
                      <p style={{ fontSize:"0.75rem", color:"var(--text-tertiary)" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Answer review */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--text-secondary)" }}>Answer Review</p>
                {questions.map((q, qi) => {
                  const correct  = q.userAnswer === q.correctAnswer;
                  const answered = q.userAnswer !== undefined;
                  const accent   = !answered ? "#D4A373" : correct ? "#52B788" : "#E63946";
                  return (
                    <div key={qi} style={{ background:"var(--cream)", border:`1px solid ${accent}33`,
                      borderLeft:`4px solid ${accent}`, borderRadius:14, padding:"16px 18px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
                        {!answered ? <span style={{ fontSize:"1rem" }}>⏭</span>
                          : correct  ? <CheckCircle size={18} color="#52B788" style={{ flexShrink:0, marginTop:2 }}/>
                          : <XCircle size={18} color="#E63946" style={{ flexShrink:0, marginTop:2 }}/>}
                        <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem", lineHeight:1.55 }}>
                          Q{qi+1}. {q.question}
                        </p>
                      </div>

                      <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
                        {q.options.map((opt, oi) => {
                          const isCorrect  = oi === q.correctAnswer;
                          const isSelected = oi === q.userAnswer;
                          return (
                            <div key={oi} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px",
                              borderRadius:9, fontSize:"0.875rem",
                              background: isCorrect ? "rgba(82,183,136,0.1)" : isSelected&&!isCorrect ? "rgba(230,57,70,0.08)" : "transparent",
                              border:`1px solid ${isCorrect?"rgba(82,183,136,0.3)":isSelected&&!isCorrect?"rgba(230,57,70,0.3)":"transparent"}` }}>
                              <span style={{ width:20, height:20, borderRadius:6, flexShrink:0,
                                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.6875rem",
                                background: isCorrect ? "#52B788" : isSelected ? "#E63946" : "var(--border)",
                                color: isCorrect||isSelected ? "#fff" : "var(--text-tertiary)" }}>
                                {["A","B","C","D"][oi]}
                              </span>
                              <span style={{ color: isCorrect ? "#52B788" : isSelected&&!isCorrect ? "#E63946" : "var(--text-secondary)" }}>
                                {opt}
                              </span>
                              {isCorrect && <span style={{ marginLeft:"auto", fontSize:"0.75rem", color:"#52B788", fontWeight:600 }}>✓ Correct</span>}
                              {isSelected && !isCorrect && <span style={{ marginLeft:"auto", fontSize:"0.75rem", color:"#E63946", fontWeight:600 }}>✗ Your answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div style={{ padding:"8px 12px", background:"rgba(72,149,239,0.06)", borderRadius:9,
                          borderLeft:"3px solid #4895EF" }}>
                          <p style={{ fontSize:"0.8125rem", color:"#4895EF", fontWeight:600, marginBottom:2 }}>💡 Explanation</p>
                          <p style={{ fontSize:"0.8125rem", color:"var(--text-secondary)", lineHeight:1.6 }}>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
