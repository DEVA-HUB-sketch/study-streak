"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library, Sparkles, PlayCircle, Globe, Map, Lightbulb,
  ExternalLink, Clock, ChevronDown, ChevronUp, BookMarked, X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import SubjectSelect, { type SubjectOption } from "@/components/ui/SubjectSelect";
import toast, { Toaster } from "react-hot-toast";
import type { ResourceResult } from "@/app/api/resources/route";

/* ── History entry type (from MongoDB) ─────────────────────── */
interface HistoryEntry extends ResourceResult { _id: string; createdAt: string; }

/* ── Resource card ──────────────────────────────────────────── */
function ResourceCard({ item, accent }: { item: { name: string; url: string; why: string }; accent: string }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.05)",
      border:`1px solid ${accent}22`, display:"flex", alignItems:"flex-start", gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:700, fontSize:"0.9375rem", color:"#fff", marginBottom:3 }}>{item.name}</p>
        <p style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{item.why}</p>
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, flexShrink:0,
          background:`${accent}20`, color:accent, fontWeight:600, fontSize:"0.8125rem", textDecoration:"none",
          border:`1px solid ${accent}33`, whiteSpace:"nowrap" }}>
        Open <ExternalLink size={12}/>
      </a>
    </div>
  );
}

/* ── Section with collapse ──────────────────────────────────── */
function Section({ title, icon, children, accent="#E63946", defaultOpen=true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  accent?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, overflow:"hidden" }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"13px 16px", background:"none", border:"none", cursor:"pointer" }}>
        <span style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
          background:`${accent}20` }}>{icon}</span>
        <span style={{ flex:1, textAlign:"left", fontWeight:700, fontSize:"0.9375rem", color:"#fff" }}>{title}</span>
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.35)"/> : <ChevronDown size={14} color="rgba(255,255,255,0.35)"/>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 16px 16px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── History card ───────────────────────────────────────────── */
function HistoryCard({ entry, onView }: { entry: HistoryEntry; onView: (e: HistoryEntry) => void }) {
  const d = new Date(entry.createdAt);
  return (
    <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:12,
      cursor:"pointer" }} onClick={()=>onView(entry)}>
      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(230,57,70,0.15)",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Library size={16} color="#E63946"/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:700, color:"#fff", fontSize:"0.875rem" }}>{entry.subject} — {entry.topic}</p>
        <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>
          {entry.difficulty} · {entry.goal || "General"} · {d.toLocaleDateString()}
        </p>
      </div>
      <span style={{ fontSize:"0.75rem", color:"#9B5DE5", fontWeight:600 }}>View →</span>
    </div>
  );
}

/* ── Form field ─────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
export default function ResourcesPage() {
  const { user } = useCurrentUser();

  const [form,     setForm]    = useState({ subject:"", topic:"", difficulty:"Intermediate", goal:"" });
  const [subjects, setSubjects]= useState<SubjectOption[]>([]);
  const [loading,  setLoading] = useState(false);
  const [result,   setResult]  = useState<ResourceResult | null>(null);
  const [history,  setHistory] = useState<HistoryEntry[]>([]);
  const [error,    setError]   = useState("");
  const [viewing,  setViewing] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    fetch("/api/subjects").then(r=>r.ok?r.json():null).then(d=>{ if(Array.isArray(d)) setSubjects(d); });
    fetch("/api/resources").then(r=>r.ok?r.json():null).then(d=>{
      if (Array.isArray(d)) setHistory(d);
    });
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
      setForm(f=>({...f,[k]:e.target.value}));

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/resources", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setResult(data as ResourceResult);
      // Refresh history
      fetch("/api/resources").then(r=>r.ok?r.json():null).then(d=>{ if(Array.isArray(d)) setHistory(d); });
      window.scrollTo({ top:400, behavior:"smooth" });
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  const displayResult: ResourceResult | null = viewing ?? result;

  return (
    <DashboardLayout user={user}>
      <Toaster position="top-right"/>
      <div className="page-container" style={{ maxWidth:900 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#4895EF,#9B5DE5)",
            display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(72,149,239,0.3)" }}>
            <Library size={24} color="#fff"/>
          </div>
          <div>
            <h1 style={{ fontSize:"1.375rem", fontWeight:800, letterSpacing:"-0.03em", color:"var(--text-primary)" }}>
              AI Learning Resources
            </h1>
            <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>
              Powered by Llama 3.3 · Curated from 30+ top resources
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.form onSubmit={handleGenerate} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:20, padding:24,
            display:"flex", flexDirection:"column", gap:16 }}>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Subject *">
              <SubjectSelect
                subjects={subjects}
                value={form.subject}
                onChange={v => setForm(f => ({ ...f, subject: v }))}
                required
                placeholder="e.g. Data Structures, DBMS"
              />
            </Field>
            <Field label="Specific Topic *">
              <input {...INP} value={form.topic} onChange={set("topic")} required
                placeholder="e.g. Binary Trees, SQL Joins, Calculus"/>
            </Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Difficulty Level">
              <select {...INP} value={form.difficulty} onChange={set("difficulty")}>
                {["Beginner","Intermediate","Advanced","Expert"].map(d=><option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Learning Goal">
              <input {...INP} value={form.goal} onChange={set("goal")}
                placeholder="e.g. GATE prep, Placement, Deep learning"/>
            </Field>
          </div>

          {error && <p style={{ fontSize:"0.875rem", color:"var(--ruby)", padding:"10px 14px",
            background:"rgba(230,57,70,0.07)", borderRadius:10 }}>{error}</p>}

          <motion.button type="submit" disabled={loading}
            whileHover={!loading?{scale:1.01}:{}} whileTap={!loading?{scale:0.98}:{}}
            className="btn btn-primary"
            style={{ alignSelf:"flex-start", paddingLeft:28, paddingRight:28, gap:8, fontSize:"0.9375rem" }}>
            {loading
              ? <><span style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",
                  borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> Finding Resources…</>
              : <><Sparkles size={15}/> Find Best Resources</>}
          </motion.button>
        </motion.form>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ background:"linear-gradient(135deg,var(--charcoal),#1A1412)", borderRadius:20,
                padding:40, textAlign:"center" }}>
              <motion.div animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:"linear" }}
                style={{ width:52, height:52, borderRadius:"50%", border:"3px solid rgba(72,149,239,0.2)",
                  borderTopColor:"#4895EF", margin:"0 auto 16px" }}/>
              <p style={{ color:"#fff", fontWeight:700, fontSize:"1rem", marginBottom:6 }}>
                Curating the best resources for {form.subject}…
              </p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.875rem" }}>Searching from 30+ top platforms. ~10 seconds.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History viewer modal (overlay) */}
        <AnimatePresence>
          {viewing && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50,
              display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
                style={{ background:"#1A1A1A", borderRadius:20, padding:24, maxWidth:700, width:"100%",
                  maxHeight:"85vh", overflowY:"auto", border:"1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div>
                    <p style={{ fontWeight:800, color:"#fff", fontSize:"1rem" }}>{viewing.subject} — {viewing.topic}</p>
                    <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>{viewing.difficulty} · {viewing.goal}</p>
                  </div>
                  <button onClick={()=>setViewing(null)}
                    style={{ background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer",
                      borderRadius:8, padding:"6px 8px", color:"rgba(255,255,255,0.6)" }}>
                    <X size={16}/>
                  </button>
                </div>
                <ResultSections data={viewing}/>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {displayResult && !viewing && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"linear-gradient(160deg,#1F1F1F,#141010)", borderRadius:20,
                padding:20, display:"flex", flexDirection:"column", gap:14 }}>
              {/* Meta header */}
              <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.04)", borderRadius:12,
                display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <Library size={18} color="#4895EF"/>
                <div>
                  <p style={{ fontWeight:700, color:"#fff" }}>{displayResult.subject} — {displayResult.topic}</p>
                  <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>
                    {displayResult.difficulty} · Goal: {displayResult.goal || "General learning"}
                  </p>
                </div>
                <button onClick={()=>{setResult(null);window.scrollTo({top:0,behavior:"smooth"});}}
                  className="btn btn-secondary" style={{ marginLeft:"auto", gap:6, color:"rgba(255,255,255,0.6)",
                    borderColor:"rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)", fontSize:"0.875rem" }}>
                  <X size={12}/> Clear
                </button>
              </div>
              <ResultSections data={displayResult}/>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <Clock size={15} color="var(--text-tertiary)"/>
              <p style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--text-secondary)" }}>
                Previous Searches ({history.length})
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {history.slice(0,8).map(h=>(
                <HistoryCard key={h._id} entry={h} onView={e=>setViewing(e)}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Shared result sections (used in both inline + modal) ─── */
function ResultSections({ data }: { data: ResourceResult }) {
  return (
    <>
      {/* YouTube Channels */}
      {data.youtubeChannels?.length > 0 && (
        <Section title="Best YouTube Channels" icon={<PlayCircle size={14} color="#E63946"/>} accent="#E63946">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.youtubeChannels.map((c,i)=><ResourceCard key={i} item={c} accent="#E63946"/>)}
          </div>
        </Section>
      )}

      {/* Websites */}
      {data.websites?.length > 0 && (
        <Section title="Best Websites & Platforms" icon={<Globe size={14} color="#4895EF"/>} accent="#4895EF">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.websites.map((w,i)=><ResourceCard key={i} item={w} accent="#4895EF"/>)}
          </div>
        </Section>
      )}

      {/* Study Strategy */}
      {data.studyStrategy?.length > 0 && (
        <Section title="Study Strategy" icon={<Lightbulb size={14} color="#D4A373"/>} accent="#D4A373">
          <ol style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:8 }}>
            {data.studyStrategy.map((s,i)=>(
              <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ width:22, height:22, borderRadius:7, background:"rgba(212,163,115,0.2)",
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  fontSize:"0.6875rem", fontWeight:800, color:"#D4A373", flexShrink:0, marginTop:1 }}>{i+1}</span>
                <span style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.65 }}>{s}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Roadmap */}
      {data.roadmap?.length > 0 && (
        <Section title="Learning Roadmap" icon={<Map size={14} color="#52B788"/>} accent="#52B788" defaultOpen={false}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10 }}>
            {data.roadmap.map((r,i)=>(
              <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:"rgba(82,183,136,0.07)",
                borderTop:"2px solid #52B788" }}>
                <p style={{ fontSize:"0.6875rem", fontWeight:700, color:"#52B788", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:4 }}>Phase {i+1}</p>
                <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", lineHeight:1.55 }}>{r}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Quick Tips */}
      {data.quickTips?.length > 0 && (
        <Section title="Quick Tips" icon={<BookMarked size={14} color="#9B5DE5"/>} accent="#9B5DE5" defaultOpen={false}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.quickTips.map((t,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px",
                background:"rgba(155,93,229,0.07)", borderRadius:10 }}>
                <span style={{ color:"#9B5DE5", flexShrink:0, marginTop:2 }}>💡</span>
                <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.82)", lineHeight:1.6 }}>{t}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
