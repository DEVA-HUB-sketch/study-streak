"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Trash2, Sparkles, TrendingUp,
  BarChart2, Brain, ChevronDown, ChevronUp, X,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import SubjectSelect, { type SubjectOption } from "@/components/ui/SubjectSelect";
import toast, { Toaster } from "react-hot-toast";
import type { PerformanceAnalysis } from "@/app/api/performance-analysis/route";

interface ExamResult {
  _id: string; userId: string; subject: string; examName: string;
  examDate: string; marksObtained: number; totalMarks: number;
  percentage: number; grade: string; studyHoursBeforeExam?: number; notes?: string;
  createdAt: string;
}

const GRADE_COLOR: Record<string, string> = {
  O:"#52B788", "A+":"#4895EF", A:"#9B5DE5", B:"#D4A373", C:"#F4A261", F:"#E63946",
};

function GradeBadge({ grade }: { grade: string }) {
  const c = GRADE_COLOR[grade] ?? "#6B6B6B";
  return (
    <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "2px 10px", borderRadius: 99,
      background: `${c}18`, color: c, border: `1px solid ${c}33` }}>{grade}</span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
const INP = { className: "input-base", style: { background: "var(--cream)", fontSize: "0.9375rem" } as React.CSSProperties };

/* ── AI Analysis Panel ──────────────────────────────────────── */
function AIPanel({ analysis, onClose }: { analysis: PerformanceAnalysis & { consistencyScore?: number }; onClose: () => void }) {
  const sections = [
    { title: "Performance Report",    content: analysis.performanceReport,   color: "#4895EF" },
    { title: "Consistency",           content: analysis.consistencyInsight,  color: "#52B788" },
    { title: "Exam Readiness",        content: `Score: ${analysis.examReadiness.score}/100 · Predicted: ${analysis.examReadiness.predicted} · ${analysis.examReadiness.confidence} confidence`, color: "#D4A373" },
    { title: "Most Improved Subject", content: analysis.mostImproved,        color: "#9B5DE5" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: "#1A1A1A", borderRadius: 20, padding: 24, maxWidth: 680, width: "100%",
          maxHeight: "88vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Brain size={20} color="#9B5DE5"/>
            <h2 style={{ fontWeight: 800, color: "#fff", fontSize: "1.0625rem" }}>AI Academic Analysis</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none",
            cursor: "pointer", borderRadius: 8, padding: "5px 7px", color: "rgba(255,255,255,0.6)" }}>
            <X size={16}/>
          </button>
        </div>

        {/* Summary sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {sections.map(s => (
            <div key={s.title} style={{ padding: "12px 14px", borderRadius: 12,
              background: `${s.color}10`, borderLeft: `3px solid ${s.color}` }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.07em", color: s.color, marginBottom: 5 }}>{s.title}</p>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>{s.content}</p>
            </div>
          ))}
        </div>

        {/* Weak subjects */}
        {analysis.weakSubjects?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E63946", textTransform: "uppercase",
              letterSpacing: "0.07em", marginBottom: 8 }}>Weak Subject Analysis</p>
            {analysis.weakSubjects.map((w, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 10,
                background: "rgba(230,57,70,0.07)", marginBottom: 6 }}>
                <p style={{ fontWeight: 700, color: "#E63946", fontSize: "0.875rem", marginBottom: 3 }}>{w.subject}</p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>{w.analysis}</p>
                <p style={{ fontSize: "0.75rem", color: "#D4A373", fontStyle: "italic" }}>→ {w.recommendation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#52B788", textTransform: "uppercase",
              letterSpacing: "0.07em", marginBottom: 8 }}>AI Recommendations</p>
            {analysis.recommendations.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8,
                padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#52B788", flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.55 }}>{r}</p>
              </div>
            ))}
          </div>
        )}

        {/* Mentor message */}
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(155,93,229,0.1)",
          border: "1px solid rgba(155,93,229,0.2)", marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Brain size={13} color="#9B5DE5"/>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9B5DE5",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>AI Mentor</span>
          </div>
          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.7,
            fontStyle: "italic" }}>&ldquo;{analysis.mentorMessage}&rdquo;</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════ */
export default function ExamsPage() {
  const { user }                      = useCurrentUser();
  const [exams,     setExams]         = useState<ExamResult[]>([]);
  const [subjects,  setSubjects]      = useState<SubjectOption[]>([]);
  const [showForm,  setShowForm]      = useState(false);
  const [saving,    setSaving]        = useState(false);
  const [aiLoading, setAILoading]     = useState(false);
  const [analysis,  setAnalysis]      = useState<(PerformanceAnalysis & { consistencyScore?: number }) | null>(null);
  const [question,  setQuestion]      = useState("");
  const [form, setForm] = useState({
    subject: "", examName: "", examDate: "", marksObtained: "", totalMarks: "", studyHoursBeforeExam: "", notes: "",
  });

  async function loadExams() {
    const r = await fetch("/api/exams");
    if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setExams(d); }
  }
  useEffect(() => {
    loadExams();
    fetch("/api/subjects").then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setSubjects(d); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(form.marksObtained) > Number(form.totalMarks)) {
      toast.error("Marks obtained cannot exceed total marks."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, marksObtained: Number(form.marksObtained), totalMarks: Number(form.totalMarks), studyHoursBeforeExam: form.studyHoursBeforeExam ? Number(form.studyHoursBeforeExam) : undefined }),
      });
      if (res.ok) {
        toast.success("Exam result saved!");
        setForm({ subject: "", examName: "", examDate: "", marksObtained: "", totalMarks: "", studyHoursBeforeExam: "", notes: "" });
        setShowForm(false); loadExams();
      } else { const d = await res.json(); toast.error(d.error ?? "Save failed."); }
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this exam result?")) return;
    const r = await fetch(`/api/exams/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Deleted."); loadExams(); }
    else toast.error("Delete failed.");
  }

  async function handleAIAnalysis() {
    setAILoading(true);
    try {
      const res = await fetch("/api/performance-analysis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Analysis failed."); return; }
      setAnalysis(data); setQuestion("");
    } catch { toast.error("Network error."); }
    finally { setAILoading(false); }
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  /* ── Chart data ─────────────────────────────────────────────── */
  const subjectAvg = useMemo(() => {
    const m: Record<string, number[]> = {};
    exams.forEach(e => { if (!m[e.subject]) m[e.subject] = []; m[e.subject].push(e.percentage); });
    return Object.entries(m).map(([name, scores]) => ({
      name,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    })).sort((a, b) => b.avg - a.avg);
  }, [exams]);

  const trendData = useMemo(() =>
    exams.slice().reverse().map(e => ({
      date: format(new Date(e.examDate), "MMM d"),
      pct: e.percentage, subject: e.subject,
    })),
  [exams]);

  const scatterData = useMemo(() =>
    exams.filter(e => e.studyHoursBeforeExam).map(e => ({
      hours: e.studyHoursBeforeExam, score: e.percentage, subject: e.subject,
    })),
  [exams]);

  const overall = exams.length > 0
    ? Math.round(exams.reduce((a, e) => a + e.percentage, 0) / exams.length)
    : null;

  return (
    <DashboardLayout user={user}>
      <Toaster position="top-right"/>
      {analysis && <AIPanel analysis={analysis} onClose={() => setAnalysis(null)}/>}

      <div style={{ padding: 24, maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg,#D4A373,#E63946)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(212,163,115,0.3)" }}>
              <GraduationCap size={24} color="#fff"/>
            </div>
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                Exam Performance
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Track marks · Analyse trends · AI grade prediction
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(v => !v)} className="btn btn-primary" style={{ gap: 6 }}>
              <Plus size={14}/> Add Result
            </button>
          </div>
        </div>

        {/* Overall score chip */}
        {overall !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 20px",
            background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "2rem", fontWeight: 900, color: overall >= 60 ? "#52B788" : "#E63946" }}>
                {overall}%
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Overall average ({exams.length} exams)</p>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ height: 8, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                <motion.div style={{ height: "100%", borderRadius: 99,
                  background: overall >= 75 ? "#52B788" : overall >= 50 ? "#D4A373" : "#E63946" }}
                  initial={{ width: 0 }} animate={{ width: `${overall}%` }} transition={{ duration: 0.8 }}/>
              </div>
            </div>
            {/* AI Analysis trigger */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 240 }}>
              <input value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Ask AI: Why are my marks dropping?"
                className="input-base" style={{ fontSize: "0.8125rem", height: 34 }}/>
              <button onClick={handleAIAnalysis} disabled={aiLoading} className="btn btn-primary"
                style={{ gap: 6, fontSize: "0.8125rem" }}>
                {aiLoading
                  ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                      borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}/> Analysing…</>
                  : <><Brain size={13}/> AI Academic Analysis</>}
              </button>
            </div>
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.form onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20,
                padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Add Exam Result</h3>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                    <X size={16}/>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Subject *">
                    <SubjectSelect
                      subjects={subjects}
                      value={form.subject}
                      onChange={v => setForm(f => ({ ...f, subject: v }))}
                      required
                      placeholder="e.g. Data Structures"
                    />
                  </Field>
                  <Field label="Exam Name *">
                    <input {...INP} value={form.examName} onChange={set("examName")} required placeholder="e.g. Mid Semester I"/>
                  </Field>
                  <Field label="Exam Date *">
                    <input type="date" {...INP} value={form.examDate} onChange={set("examDate")} required/>
                  </Field>
                  <Field label="Study Hours Before Exam">
                    <input type="number" {...INP} value={form.studyHoursBeforeExam} onChange={set("studyHoursBeforeExam")}
                      placeholder="e.g. 12" min="0"/>
                  </Field>
                  <Field label="Marks Obtained *">
                    <input type="number" {...INP} value={form.marksObtained} onChange={set("marksObtained")} required
                      placeholder="e.g. 78" min="0"/>
                  </Field>
                  <Field label="Total Marks *">
                    <input type="number" {...INP} value={form.totalMarks} onChange={set("totalMarks")} required
                      placeholder="e.g. 100" min="1"/>
                  </Field>
                </div>
                <Field label="Notes (optional)">
                  <textarea {...INP} value={form.notes} onChange={set("notes")} rows={2}
                    placeholder="Observations about this exam…" style={{ ...INP.style, resize: "none" }}/>
                </Field>

                <motion.button type="submit" disabled={saving}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="btn btn-primary" style={{ alignSelf: "flex-start", paddingLeft: 24, paddingRight: 24, gap: 6 }}>
                  {saving ? "Saving…" : <><Sparkles size={14}/> Save Result</>}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Charts */}
        {exams.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Subject Average */}
            <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <BarChart2 size={15} color="var(--ruby)"/>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Subject Averages</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectAvg} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }}/>
                  <Bar dataKey="avg" fill="#E63946" radius={[6, 6, 0, 0]} name="Avg %"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Marks Trend */}
            <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <TrendingUp size={15} color="#4895EF"/>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Marks Trend</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }}/>
                  <Line type="monotone" dataKey="pct" stroke="#4895EF" strokeWidth={2} dot={{ fill: "#4895EF", r: 4 }} name="Score %"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Study Hours vs Score */}
            {scatterData.length > 1 && (
              <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, gridColumn: "1/-1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                  <Sparkles size={15} color="#D4A373"/>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Study Hours vs Score</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginLeft: 4 }}>correlation chart</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                    <XAxis dataKey="hours" name="Study Hours" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} label={{ value: "Study Hours", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--text-tertiary)" }}/>
                    <YAxis dataKey="score" name="Score %" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} label={{ value: "Score %", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--text-tertiary)" }}/>
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }}/>
                    <Scatter data={scatterData} fill="#D4A373" name="Exam"/>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Exam History Table */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={16} color="var(--ruby)"/>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Exam History</h3>
            <span className="badge badge-ruby" style={{ marginLeft: "auto" }}>{exams.length}</span>
          </div>

          {exams.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "2rem", marginBottom: 8 }}>📝</p>
              <p style={{ color: "var(--text-secondary)" }}>No exam results yet. Add your first result above!</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 90px 100px 80px 80px 40px",
                padding: "8px 20px", gap: 8 }}>
                {["Subject","Exam","Date","Marks","Score","Grade",""].map(h => (
                  <span key={h} className="t-caption" style={{ color: "var(--text-tertiary)", fontSize: "0.6875rem" }}>{h}</span>
                ))}
              </div>
              {exams.map((e, i) => (
                <motion.div key={e._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 90px 100px 80px 80px 40px",
                    alignItems: "center", padding: "10px 20px", gap: 8,
                    borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>{e.subject}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{e.examName}</span>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>{format(new Date(e.examDate), "MMM d, yy")}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{e.marksObtained}/{e.totalMarks}</span>
                  <span style={{ fontWeight: 700, color: e.percentage >= 60 ? "#52B788" : "#E63946" }}>{e.percentage}%</span>
                  <GradeBadge grade={e.grade}/>
                  <button onClick={() => handleDelete(e._id)} className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: "var(--ruby)" }}>
                    <Trash2 size={13}/>
                  </button>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
