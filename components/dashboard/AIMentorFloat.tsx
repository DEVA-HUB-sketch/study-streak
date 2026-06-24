"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { PerformanceAnalysis } from "@/app/api/performance-analysis/route";
import toast from "react-hot-toast";

const QUICK = [
  "Why are my marks dropping?",
  "Which subject needs most attention?",
  "Am I improving overall?",
  "How many hours for my next exam?",
  "Generate a revision strategy.",
];

export default function AIMentorFloat() {
  const [open,     setOpen]     = useState(false);
  const [question, setQuestion] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<(PerformanceAnalysis & { consistencyScore?: number }) | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function ask(q?: string) {
    const finalQ = (q ?? question).trim();
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/performance-analysis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQ || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Analysis failed."); return; }
      setResult(data); setQuestion("");
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 40,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg,#9B5DE5,#4895EF)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(155,93,229,0.45)",
        }}
        title="Ask AI About My Performance"
      >
        {open ? <X size={20} color="#fff"/> : <Brain size={20} color="#fff"/>}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: "fixed", bottom: 92, right: 28, zIndex: 41,
              width: 360, borderRadius: 20,
              background: "linear-gradient(160deg,#1F1F1F,#141010)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              maxHeight: "70vh",
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9,
                background: "linear-gradient(135deg,#9B5DE5,#4895EF)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain size={15} color="#fff"/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.875rem" }}>AI Academic Mentor</p>
                <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>
                  Ask anything about your performance
                </p>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

              {/* Quick questions */}
              {!result && !loading && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                    Quick Questions
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {QUICK.map(q => (
                      <button key={q} onClick={() => ask(q)}
                        style={{ textAlign: "left", padding: "8px 12px", borderRadius: 9,
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                          cursor: "pointer", color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem",
                          lineHeight: 1.4, transition: "background 0.15s" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(155,93,229,0.2)",
                      borderTopColor: "#9B5DE5", margin: "0 auto 12px" }}/>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>Analysing your data…</p>
                </div>
              )}

              {/* Result */}
              {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Mentor message (always shown) */}
                  <div style={{ padding: "12px 14px", borderRadius: 12,
                    background: "rgba(155,93,229,0.12)", border: "1px solid rgba(155,93,229,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Sparkles size={12} color="#9B5DE5"/>
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#9B5DE5",
                        textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Mentor</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.65,
                      fontStyle: "italic" }}>&ldquo;{result.mentorMessage}&rdquo;</p>
                  </div>

                  {/* Exam readiness */}
                  <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(212,163,115,0.1)" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D4A373", marginBottom: 4 }}>
                      Exam Readiness: {result.examReadiness.score}/100
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)" }}>
                      Predicted: {result.examReadiness.predicted} · {result.examReadiness.confidence} confidence
                    </p>
                  </div>

                  {/* Expandable full analysis */}
                  <button onClick={() => setExpanded(v => !v)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 9, padding: "7px 0", cursor: "pointer", color: "rgba(255,255,255,0.6)",
                      fontSize: "0.8125rem", fontWeight: 600 }}>
                    {expanded ? <><ChevronUp size={13}/> Less</> : <><ChevronDown size={13}/> Full Analysis</>}
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                            {result.performanceReport}
                          </p>
                          {result.recommendations?.slice(0, 3).map((r, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, fontSize: "0.8125rem",
                              color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                              <span style={{ color: "#52B788", flexShrink: 0 }}>✓</span>{r}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button onClick={() => setResult(null)} className="btn btn-secondary"
                    style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)",
                      borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}>
                    Ask another question
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            {!result && (
              <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex", gap: 8 }}>
                <input value={question} onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
                  placeholder="Ask your mentor…"
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: "0.875rem", outline: "none" }}/>
                <button onClick={() => ask()} disabled={loading || !question.trim()}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                    background: question.trim() ? "linear-gradient(135deg,#9B5DE5,#4895EF)" : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={14} color="#fff"/>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
