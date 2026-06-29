"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, BookOpen, Brain, List,
  CheckSquare, Zap, HelpCircle, RotateCcw, ChevronDown, ChevronUp,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import toast, { Toaster } from "react-hot-toast";
import type { AssistantAction, AssistantResult } from "@/app/api/study-assistant/route";

const ACTIONS: { id: AssistantAction; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id:"summarize",   label:"Smart Summary",      icon:<BookOpen size={18}/>,   color:"#4895EF", desc:"Condense into key sections" },
  { id:"quiz",        label:"Quiz Generator",     icon:<HelpCircle size={18}/>, color:"#E63946", desc:"MCQ questions with answers" },
  { id:"flashcards",  label:"Flashcards",         icon:<Zap size={18}/>,        color:"#9B5DE5", desc:"Concept-answer flip cards" },
  { id:"keypoints",   label:"Key Points",         icon:<List size={18}/>,       color:"#52B788", desc:"Most important facts" },
  { id:"explain",     label:"Explain Topics",     icon:<Brain size={18}/>,      color:"#D4A373", desc:"Simple language breakdown" },
  { id:"checklist",   label:"Revision Checklist", icon:<CheckSquare size={18}/>,color:"#F4A261", desc:"All topics to revise" },
];

/* ── Flip card for flashcards ────────────────────────────── */
function FlipCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(f => !f)}
      style={{ cursor: "pointer", perspective: 600, height: 120 }}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: "relative", transformStyle: "preserve-3d", height: "100%" }}>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: "rgba(155,93,229,0.08)", border: "1px solid rgba(155,93,229,0.2)",
          borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 1.5 }}>{front}</p>
        </div>
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "rgba(82,183,136,0.08)", border: "1px solid rgba(82,183,136,0.2)",
          borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.82)", textAlign: "center", lineHeight: 1.55 }}>{back}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Quiz question card ──────────────────────────────────── */
function QuizCard({ q, index }: { q: { question: string; options: string[]; answer: string; explanation: string }; index: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExpl, setShowExpl] = useState(false);

  function pick(opt: string) {
    if (selected) return;
    setSelected(opt);
    setShowExpl(true);
  }

  const label = (i: number) => ["A","B","C","D"][i] ?? String(i+1);
  const correct = selected === q.answer;

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff", lineHeight: 1.5 }}>
        <span style={{ color: "#E63946", marginRight: 8 }}>Q{index+1}.</span>{q.question}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {q.options.map((opt, i) => {
          const lbl = label(i);
          const isCorrect  = lbl === q.answer;
          const isSelected = lbl === selected;
          const bg = !selected ? "rgba(255,255,255,0.05)" :
                     isCorrect  ? "rgba(82,183,136,0.15)" :
                     isSelected ? "rgba(230,57,70,0.12)"  : "rgba(255,255,255,0.03)";
          const border = !selected ? "rgba(255,255,255,0.1)" :
                         isCorrect  ? "rgba(82,183,136,0.4)"  :
                         isSelected ? "rgba(230,57,70,0.4)"   : "rgba(255,255,255,0.07)";
          return (
            <button key={i} onClick={() => pick(lbl)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", borderRadius: 9,
                background: bg, border: `1px solid ${border}`, cursor: selected ? "default" : "pointer", textAlign: "left" }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                background: isCorrect && selected ? "#52B788" : isSelected && !isCorrect ? "#E63946" : "rgba(255,255,255,0.08)",
                fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{lbl}</span>
              <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.85)" }}>{opt}</span>
            </button>
          );
        })}
      </div>
      {showExpl && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 13px", borderRadius: 9,
            background: correct ? "rgba(82,183,136,0.07)" : "rgba(230,57,70,0.07)",
            border: `1px solid ${correct ? "rgba(82,183,136,0.2)" : "rgba(230,57,70,0.2)"}` }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: correct ? "#52B788" : "#E63946", marginBottom: 4 }}>
              {correct ? "✓ Correct!" : `✗ Incorrect — Answer: ${q.answer}`}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{q.explanation}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Content renderer (for text-based results) ───────────── */
function ContentRenderer({ content }: { content: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {content.split("\n").filter(l => l.trim()).map((line, i) => {
        const isBullet  = /^[-•*]\s/.test(line);
        const isHeader  = /^#+\s/.test(line) || /^\d+\.\s/.test(line);
        const isCheck   = /^☐|^- \[/.test(line);
        const text = line.replace(/^[-•*#\s]+/, "").replace(/\*\*/g, "").trim();
        return (
          <p key={i} style={{
            fontSize:   isHeader ? "0.9375rem" : "0.875rem",
            fontWeight: isHeader ? 700 : 400,
            color:      isHeader ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.78)",
            lineHeight: 1.65,
            paddingLeft: isBullet || isCheck ? 16 : 0,
            borderLeft:  isHeader ? "2px solid #E63946" : "none",
            paddingTop:  isHeader ? 4 : 0,
            paddingBottom: isHeader ? 2 : 0,
          }}>
            {isBullet && <span style={{ color: "#E63946", marginRight: 8 }}>•</span>}
            {isCheck  && <span style={{ color: "#52B788", marginRight: 8 }}>☐</span>}
            {text}
          </p>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════ */
export default function StudyAssistantPage() {
  const { user } = useCurrentUser();
  const [mode,         setMode]         = useState<"upload" | "paste">("upload");
  const [file,         setFile]         = useState<File | null>(null);
  const [pasteText,    setPasteText]    = useState("");
  const [action,       setAction]       = useState<AssistantAction>("summarize");
  const [query,        setQuery]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<AssistantResult | null>(null);
  const [error,        setError]        = useState("");
  const [dragOver,     setDragOver]     = useState(false);
  const [expandAll,    setExpandAll]    = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  const analyse = useCallback(async () => {
    if (mode === "upload" && !file) { toast.error("Please upload a file first"); return; }
    if (mode === "paste"  && !pasteText.trim()) { toast.error("Please paste some text first"); return; }

    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      if (mode === "upload" && file) fd.append("file", file);
      if (mode === "paste")          fd.append("text", pasteText);
      fd.append("action", action);
      fd.append("query",  query);

      const res = await fetch("/api/study-assistant", { method: "POST", body: fd });
      const d   = await res.json();
      if (!res.ok) { setError(d.error ?? "Analysis failed"); return; }
      setResult(d as AssistantResult);
      toast.success("Analysis complete!");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [mode, file, pasteText, action, query]);

  const selectedAction = ACTIONS.find(a => a.id === action)!;

  return (
    <DashboardLayout user={user}>
      <Toaster position="top-right"/>
      <div className="page-container" style={{ maxWidth: 900 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#4895EF,#9B5DE5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={22} color="#fff"/>
          </div>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)" }}>PDF Study Assistant</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Upload notes · Get AI-powered summaries, quizzes, flashcards & more</p>
          </div>
        </div>

        {/* Input section */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--border)", borderRadius: 10, padding: 3, width: "fit-content" }}>
            {(["upload","paste"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                  background: mode === m ? "#E63946" : "transparent",
                  color: mode === m ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
                {m === "upload" ? "Upload File" : "Paste Text"}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {mode === "upload" && (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#E63946" : "var(--border)"}`, borderRadius: 14, padding: "32px 20px", textAlign: "center",
                cursor: "pointer", transition: "all 0.2s", background: dragOver ? "rgba(230,57,70,0.04)" : "transparent" }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,text/plain,application/pdf"
                onChange={handleFileSelect} style={{ display: "none" }}/>
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <FileText size={20} color="#4895EF"/>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{file.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>({(file.size / 1024).toFixed(0)} KB)</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#E63946", padding: 2 }}>
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={28} color="rgba(230,57,70,0.5)" style={{ margin: "0 auto 10px" }}/>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Drop PDF or TXT here</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>or click to browse · PDF and TXT supported</p>
                </>
              )}
            </div>
          )}

          {/* Paste zone */}
          {mode === "paste" && (
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
              placeholder="Paste your notes, lecture content, or any text here…"
              rows={8}
              style={{ width: "100%", resize: "vertical", background: "#fff", border: "1px solid var(--border)", borderRadius: 12,
                padding: "12px 14px", fontSize: "0.875rem", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}/>
          )}

          {/* Action selector */}
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>What would you like to do?</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {ACTIONS.map(a => (
                <button key={a.id} onClick={() => setAction(a.id)}
                  style={{ padding: "12px 10px", borderRadius: 12, border: `2px solid ${action === a.id ? a.color : "var(--border)"}`,
                    background: action === a.id ? `${a.color}12` : "#fff",
                    cursor: "pointer", textAlign: "center", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ color: action === a.id ? a.color : "var(--text-secondary)" }}>{a.icon}</span>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: action === a.id ? a.color : "var(--text-primary)", lineHeight: 1.2 }}>{a.label}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", lineHeight: 1.3 }}>{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Optional query */}
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
              Additional question or focus area (optional)
            </label>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Focus on thermodynamics / Explain recursion simply…"
              style={{ width: "100%", background: "#fff", border: "1px solid var(--border)", borderRadius: 10,
                padding: "10px 14px", fontSize: "0.875rem", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}/>
          </div>

          {error && <p style={{ fontSize: "0.875rem", color: "#E63946", padding: "10px 14px", background: "rgba(230,57,70,0.07)", borderRadius: 10 }}>{error}</p>}

          <button onClick={analyse} disabled={loading}
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 12,
              background: loading ? "rgba(230,57,70,0.4)" : "linear-gradient(135deg,#E63946,#C1121F)",
              border: "none", color: "#fff", fontWeight: 700, fontSize: "0.9375rem", cursor: loading ? "default" : "pointer" }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}/> Analysing…</>
              : <><span>{selectedAction.icon}</span> {selectedAction.label}</>}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "linear-gradient(160deg,#1F1F1F,#141010)", borderRadius: 20, padding: 22,
                border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Result header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: selectedAction.color }}>{selectedAction.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.9375rem" }}>{selectedAction.label}</p>
                    <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>{result.title}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setExpandAll(e => !e)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                    {expandAll ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {expandAll ? "Collapse" : "Expand"}
                  </button>
                  <button onClick={() => setResult(null)}
                    style={{ padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                    <RotateCcw size={13}/>
                  </button>
                </div>
              </div>

              {/* Quiz */}
              {result.action === "quiz" && result.quiz && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{result.quiz.length} questions · Click an option to reveal answer</p>
                  {result.quiz.map((q, i) => <QuizCard key={i} q={q} index={i}/>)}
                </div>
              )}

              {/* Flashcards */}
              {result.action === "flashcards" && result.flashcards && (
                <div>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>{result.flashcards.length} cards · Click to flip</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                    {result.flashcards.map((fc, i) => <FlipCard key={i} front={fc.front} back={fc.back}/>)}
                  </div>
                </div>
              )}

              {/* Text content */}
              {!["quiz","flashcards"].includes(result.action) && result.content && (
                <ContentRenderer content={result.content}/>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
