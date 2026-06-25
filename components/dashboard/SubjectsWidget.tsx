"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Pencil, Trash2, X, Check, Clock } from "lucide-react";
import toast from "react-hot-toast";

export interface Subject {
  _id:          string;
  name:         string;
  color:        string;
  icon:         string;
  totalMinutes: number;
  sessionCount: number;
}

interface Props {
  /** Called after any create / update / delete so parent can refresh sessions etc. */
  onChanged?: () => void;
}

const COLORS = [
  "#E63946","#4895EF","#52B788","#D4A373",
  "#9B5DE5","#F4A261","#E9C46A","#2A9D8F",
];
const ICONS = ["📚","🔬","🧮","🎨","💻","🏛","🎵","📖","⚗","🌍","🔭","📐","🧬","🖥","📝"];

const EMPTY_FORM = { name: "", color: COLORS[0], icon: ICONS[0] };

export default function SubjectsWidget({ onChanged }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editing,  setEditing]  = useState<Subject | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/subjects");
      if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setSubjects(d); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setForm({ name: s.name, color: s.color, icon: s.icon });
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }

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
        toast.success(editing ? `"${form.name}" updated!` : `"${form.name}" added!`);
        cancelForm();
        await load();
        onChanged?.();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to save subject.");
      }
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Sessions logged under this subject will not be deleted.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success(`"${name}" deleted.`); await load(); onChanged?.(); }
      else toast.error("Failed to delete subject.");
    } catch { toast.error("Network error."); }
    finally { setDeletingId(null); }
  }

  return (
    <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={16} color="var(--ruby)"/>
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
            My Subjects
          </h3>
          {subjects.length > 0 && (
            <span className="badge badge-ruby">{subjects.length}</span>
          )}
        </div>
        <motion.button
          onClick={showForm ? cancelForm : openAdd}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 10, border: "none", cursor: "pointer", fontSize: "0.8125rem",
            fontWeight: 600, transition: "all 0.2s",
            background: showForm ? "var(--border)" : "var(--ruby)",
            color: showForm ? "var(--text-secondary)" : "#fff" }}>
          {showForm ? <><X size={13}/> Cancel</> : <><Plus size={13}/> Add Subject</>}
        </motion.button>
      </div>

      {/* ── Inline form ────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: "hidden", borderBottom: "1px solid var(--border)" }}>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Name */}
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)",
                  display: "block", marginBottom: 6 }}>
                  Subject Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Data Structures, Mathematics…"
                  required autoFocus
                  className="input-base"
                  style={{ background: "var(--warm-white)" }}
                />
              </div>

              {/* Icon picker */}
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)",
                  display: "block", marginBottom: 8 }}>
                  Icon
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ICONS.map(ic => (
                    <motion.button key={ic} type="button"
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      style={{ width: 36, height: 36, borderRadius: 9, fontSize: "1.125rem",
                        cursor: "pointer", border: "2px solid",
                        background: form.icon === ic ? `${form.color}18` : "var(--warm-white)",
                        borderColor: form.icon === ic ? form.color : "var(--border)" }}>
                      {ic}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Colour picker */}
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)",
                  display: "block", marginBottom: 8 }}>
                  Colour
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map(c => (
                    <motion.button key={c} type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      style={{ width: 28, height: 28, borderRadius: "50%",
                        background: c, cursor: "pointer", border: "3px solid",
                        borderColor: form.color === c ? "var(--text-primary)" : "transparent",
                        boxShadow: form.color === c ? `0 0 0 2px ${c}44` : "none",
                        transition: "all 0.15s" }}>
                      {form.color === c && <Check size={12} color="#fff" style={{ display: "block", margin: "auto" }}/>}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Preview + Save */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Preview chip */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px",
                  borderRadius: 99, background: `${form.color}15`,
                  border: `1.5px solid ${form.color}33`, flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>{form.icon}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: form.color }}>
                    {form.name || "Preview"}
                  </span>
                </div>

                <motion.button type="submit" disabled={saving}
                  whileHover={!saving ? { scale: 1.02 } : {}}
                  whileTap={!saving ? { scale: 0.97 } : {}}
                  className="btn btn-primary" style={{ gap: 7 }}>
                  {saving
                    ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                        animation: "spin 0.8s linear infinite" }}/> Saving…</>
                    : <><Check size={14}/> {editing ? "Update" : "Add Subject"}</>
                  }
                </motion.button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Subject list ───────────────────────────────────────── */}
      {loading ? (
        /* Skeleton */
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 52, borderRadius: 12, background: "var(--border)",
              animation: "shimmer 1.4s linear infinite",
              backgroundImage: "linear-gradient(90deg,var(--border) 25%,rgba(0,0,0,0.04) 50%,var(--border) 75%)",
              backgroundSize: "200% 100%" }}/>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: 10 }}>📚</p>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            No subjects yet
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
            Add your first subject to use it in sessions, tests, and AI features.
          </p>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <AnimatePresence>
            {subjects.map((s, i) => (
              <motion.div key={s._id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.03 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  borderRadius: 12, background: "var(--warm-white)", border: "1px solid var(--border)",
                  transition: "box-shadow 0.2s" }}
                className="card-hover">

                {/* Icon + name */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.125rem", flexShrink: 0 }}>
                  {s.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                    {s.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3,
                      fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      <Clock size={10}/> {s.totalMinutes} min
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      {s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: 56, height: 4, borderRadius: 99,
                  background: "var(--border)", overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ height: "100%", borderRadius: 99, background: s.color,
                    width: `${Math.min((s.totalMinutes / 600) * 100, 100)}%`,
                    transition: "width 0.6s ease" }}/>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <motion.button onClick={() => openEdit(s)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    title={`Edit ${s.name}`}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                      background: "rgba(72,149,239,0.1)", color: "#4895EF",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Pencil size={12}/>
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(s._id, s.name)}
                    disabled={deletingId === s._id}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    title={`Delete ${s.name}`}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                      background: "rgba(230,57,70,0.1)", color: "var(--ruby)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: deletingId === s._id ? 0.5 : 1 }}>
                    <Trash2 size={12}/>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
