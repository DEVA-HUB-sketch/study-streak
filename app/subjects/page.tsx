"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Pencil, Trash2, Clock, X, Check, Layers } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Subject {
  _id: string; name: string; color: string; icon: string;
  totalMinutes: number; sessionCount: number;
}

const COLORS = [
  { hex:"#E63946", label:"Ruby"    },
  { hex:"#4895EF", label:"Blue"    },
  { hex:"#52B788", label:"Green"   },
  { hex:"#D4A373", label:"Gold"    },
  { hex:"#9B5DE5", label:"Purple"  },
  { hex:"#F4A261", label:"Orange"  },
  { hex:"#E9C46A", label:"Yellow"  },
  { hex:"#2A9D8F", label:"Teal"    },
  { hex:"#E76F51", label:"Coral"   },
  { hex:"#264653", label:"Slate"   },
];

const ICONS = [
  "📚","🔬","🧮","🎨","💻","🏛","🎵","📖",
  "⚗","🌍","🔭","📐","🧬","🖥","📝","🏆",
  "🎯","📊","🧠","📡",
];

const EMPTY = { name: "", color: COLORS[0].hex, icon: ICONS[0] };

export default function SubjectsPage() {
  const { user }                      = useCurrentUser();
  const [subjects,   setSubjects]     = useState<Subject[]>([]);
  const [totalRubies,setTotalRubies]  = useState(0);
  const [showForm,   setShowForm]     = useState(false);
  const [editing,    setEditing]      = useState<Subject | null>(null);
  const [form,       setForm]         = useState(EMPTY);
  const [saving,     setSaving]       = useState(false);
  const [deletingId, setDeletingId]   = useState<string|null>(null);

  async function load() {
    const [sr, rr] = await Promise.all([fetch("/api/subjects"), fetch("/api/stats")]);
    const s = await sr.json(); if (Array.isArray(s)) setSubjects(s);
    const r = await rr.json(); if (r?.totalRubies) setTotalRubies(r.totalRubies);
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Subject name is required."); return; }
    setSaving(true);
    try {
      const url    = editing ? `/api/subjects/${editing._id}` : "/api/subjects";
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), color: form.color, icon: form.icon }),
      });
      if (res.ok) {
        toast.success(editing ? `"${form.name}" updated!` : `"${form.name}" created!`);
        reset(); load();
      } else { const d = await res.json(); toast.error(d.error ?? "Failed to save."); }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success(`"${name}" deleted.`); load(); }
      else toast.error("Failed to delete.");
    } finally { setDeletingId(null); }
  }

  function startEdit(s: Subject) {
    setEditing(s); setForm({ name: s.name, color: s.color, icon: s.icon });
    setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditing(null); setForm(EMPTY); setShowForm(false);
  }

  const totalHours = +(subjects.reduce((a, s) => a + s.totalMinutes, 0) / 60).toFixed(1);

  return (
    <DashboardLayout user={user} totalRubies={totalRubies}>
      <Toaster position="top-right"/>
      <div style={{ padding: 24, maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg,var(--ruby),var(--ruby-dark))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(230,57,70,0.25)" }}>
              <Layers size={22} color="#fff"/>
            </div>
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em",
                color: "var(--text-primary)", marginBottom: 2 }}>Subjects</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {subjects.length > 0
                  ? `${subjects.length} subject${subjects.length !== 1 ? "s" : ""} · ${totalHours}h studied`
                  : "Organise your study sessions by subject"}
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => { if (showForm && !editing) { reset(); } else { setEditing(null); setForm(EMPTY); setShowForm(true); } }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="btn btn-primary" style={{ gap: 7 }}>
            {showForm && !editing ? <><X size={15}/> Cancel</> : <><Plus size={15}/> New Subject</>}
          </motion.button>
        </div>

        {/* ── Add / Edit form ─────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22, ease: "easeOut" }}>
              <form onSubmit={handleSubmit}
                style={{ background: "var(--cream)", border: `2px solid ${form.color}33`,
                  borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Form title */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, fontSize: "1.375rem",
                    background: `${form.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                      {editing ? `Editing "${editing.name}"` : "New Subject"}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                      Choose an icon, colour, and name
                    </p>
                  </div>
                  {(showForm && editing) && (
                    <button type="button" onClick={reset}
                      style={{ marginLeft: "auto", background: "none", border: "none",
                        cursor: "pointer", color: "var(--text-tertiary)", padding: 6 }}>
                      <X size={16}/>
                    </button>
                  )}
                </div>

                {/* Name input */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Subject Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Data Structures, Mathematics, Physics…"
                    required autoFocus
                    className="input-base"
                    style={{ background: "var(--warm-white)", fontSize: "1rem" }}
                  />
                </div>

                {/* Icon + Colour side by side */}
                <div className="grid-2-col">

                  {/* Icon picker */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>Icon</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                      {ICONS.map(ic => (
                        <motion.button key={ic} type="button"
                          onClick={() => setForm(f => ({ ...f, icon: ic }))}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                          style={{ height: 40, borderRadius: 10, fontSize: "1.125rem",
                            cursor: "pointer", border: "2px solid",
                            background: form.icon === ic ? `${form.color}18` : "var(--warm-white)",
                            borderColor: form.icon === ic ? form.color : "var(--border)",
                            transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {ic}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Colour picker */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>Colour</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                      {COLORS.map(({ hex, label }) => (
                        <motion.button key={hex} type="button"
                          title={label}
                          onClick={() => setForm(f => ({ ...f, color: hex }))}
                          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                          style={{ height: 40, borderRadius: 10, background: hex, cursor: "pointer",
                            border: "2px solid", borderColor: form.color === hex ? "var(--text-primary)" : "transparent",
                            boxShadow: form.color === hex ? `0 0 0 3px ${hex}44` : "none",
                            transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {form.color === hex && <Check size={14} color="#fff" strokeWidth={3}/>}
                        </motion.button>
                      ))}
                    </div>

                    {/* Live preview */}
                    <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 12,
                      background: "var(--warm-white)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-tertiary)",
                        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Preview</p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "6px 14px", borderRadius: 99,
                        background: `${form.color}15`, border: `1.5px solid ${form.color}33` }}>
                        <span style={{ fontSize: "1rem" }}>{form.icon}</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: form.color }}>
                          {form.name || "Subject Name"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                  <motion.button type="submit" disabled={saving}
                    whileHover={!saving ? { scale: 1.01 } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                    className="btn btn-primary" style={{ flex: 1, gap: 8, fontSize: "0.9375rem" }}>
                    {saving
                      ? <><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                          animation: "spin 0.8s linear infinite" }}/> Saving…</>
                      : <><Check size={15}/> {editing ? "Save Changes" : "Create Subject"}</>
                    }
                  </motion.button>
                  <motion.button type="button" onClick={reset}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="btn btn-secondary" style={{ gap: 6 }}>
                    <X size={14}/> Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Subject grid ─────────────────────────────────────── */}
        {subjects.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20,
              padding: "56px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📚</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-primary)", marginBottom: 6 }}>
              No subjects yet
            </h3>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 24, maxWidth: 340, margin: "0 auto 24px" }}>
              Create your first subject to organise sessions, generate tests, and track your progress.
            </p>
            <motion.button onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn btn-primary" style={{ gap: 7 }}>
              <Plus size={15}/> Create First Subject
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            <AnimatePresence>
              {subjects.map((s, i) => (
                <motion.div key={s._id}
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3, boxShadow: "var(--shadow-lg)" }}
                  style={{ background: "var(--cream)", border: "1px solid var(--border)",
                    borderTop: `3px solid ${s.color}`, borderRadius: 16,
                    padding: "18px 18px 14px", display: "flex", flexDirection: "column", gap: 0,
                    boxShadow: "var(--shadow-sm)", cursor: "default", transition: "box-shadow 0.2s, transform 0.2s" }}>

                  {/* Top row — icon + actions */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, fontSize: "1.375rem",
                      background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.icon}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <motion.button onClick={() => startEdit(s)}
                        whileHover={{ scale: 1.1, background: "rgba(72,149,239,0.15)" }}
                        whileTap={{ scale: 0.9 }} title="Edit"
                        style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
                          background: "rgba(72,149,239,0.08)", color: "#4895EF",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background 0.15s" }}>
                        <Pencil size={13}/>
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(s._id, s.name)}
                        disabled={deletingId === s._id}
                        whileHover={{ scale: 1.1, background: "rgba(230,57,70,0.15)" }}
                        whileTap={{ scale: 0.9 }} title="Delete"
                        style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
                          background: "rgba(230,57,70,0.08)", color: "var(--ruby)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: deletingId === s._id ? 0.5 : 1, transition: "background 0.15s" }}>
                        <Trash2 size={13}/>
                      </motion.button>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--text-primary)",
                    marginBottom: 6, lineHeight: 1.2 }}>
                    {s.name}
                  </h3>

                  {/* Stats row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14,
                    fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12}/> {s.totalMinutes >= 60
                        ? `${+(s.totalMinutes / 60).toFixed(1)}h`
                        : `${s.totalMinutes}m`}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={12}/> {s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 5, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${Math.min((s.totalMinutes / 600) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                      style={{ height: "100%", borderRadius: 99, background: s.color }}
                    />
                  </div>

                  {/* Colour label */}
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }}/>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 500 }}>
                      {COLORS.find(c => c.hex === s.color)?.label ?? "Custom"} theme
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
