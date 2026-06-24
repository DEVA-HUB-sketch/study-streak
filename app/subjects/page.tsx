"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Pencil, Trash2, Clock } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Subject { _id: string; name: string; color: string; icon: string; totalMinutes: number; sessionCount: number; }

const PRESET_COLORS = ["#E63946","#4895EF","#52B788","#D4A373","#9B5DE5","#F4A261","#E9C46A","#2A9D8F"];
const PRESET_ICONS  = ["📚","🔬","🧮","🎨","💻","🏛","🎵","📖","⚗","🌍"];

export default function SubjectsPage() {
  const { user }                          = useCurrentUser();
  const [subjects,  setSubjects]          = useState<Subject[]>([]);
  const [totalRubies, setTotalRubies]     = useState(0);
  const [showForm,  setShowForm]          = useState(false);
  const [editing,   setEditing]           = useState<Subject | null>(null);
  const [form,      setForm]              = useState({ name: "", color: PRESET_COLORS[0], icon: PRESET_ICONS[0] });

  async function load() {
    const [sr, rr] = await Promise.all([fetch("/api/subjects"), fetch("/api/stats")]);
    const s = await sr.json(); if (Array.isArray(s)) setSubjects(s);
    const r = await rr.json(); if (r?.totalRubies) setTotalRubies(r.totalRubies);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url    = editing ? `/api/subjects/${editing._id}` : "/api/subjects";
    const method = editing ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success(editing ? "Subject updated!" : "Subject created!"); reset(); load(); }
    else         toast.error("Failed to save subject.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subject?")) return;
    const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Subject deleted."); load(); }
    else         toast.error("Failed to delete subject.");
  }

  function startEdit(s: Subject) {
    setEditing(s); setForm({ name: s.name, color: s.color, icon: s.icon }); setShowForm(true);
  }

  function reset() {
    setEditing(null); setForm({ name: "", color: PRESET_COLORS[0], icon: PRESET_ICONS[0] }); setShowForm(false);
  }

  const inputCls   = "w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.7)", borderColor: "rgba(212,163,115,0.3)", color: "var(--dark)" };

  return (
    <DashboardLayout user={user} totalRubies={totalRubies}>
      <Toaster position="top-right" />
      <div className="p-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BookOpen size={22} style={{ color: "var(--ruby)" }} />
              <h1 className="text-xl font-bold" style={{ color: "var(--dark)" }}>Subjects</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--dark-soft)", opacity: 0.55 }}>Organise your study sessions by subject.</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--ruby), var(--ruby-dark))" }}
          >
            <Plus size={15} /> New Subject
          </motion.button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 card-ruby space-y-4">
                <h2 className="font-semibold text-sm" style={{ color: "var(--dark)" }}>
                  {editing ? "Edit Subject" : "New Subject"}
                </h2>

                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Subject name"
                  required
                  className={inputCls}
                  style={inputStyle}
                />

                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "var(--dark-soft)", opacity: 0.7 }}>Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_ICONS.map((ic) => (
                      <button key={ic} type="button"
                        onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                        className="w-9 h-9 rounded-xl text-lg transition-all"
                        style={{ background: form.icon === ic ? "rgba(230,57,70,0.15)" : "rgba(0,0,0,0.05)", border: form.icon === ic ? "2px solid var(--ruby)" : "2px solid transparent" }}
                      >{ic}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "var(--dark-soft)", opacity: 0.7 }}>Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button key={c} type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-full transition-all"
                        style={{ background: c, border: form.color === c ? "3px solid var(--dark)" : "3px solid transparent", transform: form.color === c ? "scale(1.2)" : "scale(1)" }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, var(--ruby), var(--ruby-dark))" }}>
                    {editing ? "Update" : "Create"}
                  </button>
                  <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl text-sm border"
                    style={{ borderColor: "rgba(45,45,45,0.15)", color: "var(--dark-soft)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject grid */}
        {subjects.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center" style={{ color: "var(--dark-soft)", opacity: 0.4 }}>
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No subjects yet. Create one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {subjects.map((s, i) => (
                <motion.div key={s._id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                  className="glass rounded-2xl p-5 group"
                  style={{ borderTop: `3px solid ${s.color}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${s.color}20` }}>
                      {s.icon}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50" style={{ color: "#4895EF" }}><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "var(--ruby)" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1" style={{ color: "var(--dark)" }}>{s.name}</h3>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--dark-soft)", opacity: 0.55 }}>
                    <span className="flex items-center gap-1"><Clock size={10} /> {s.totalMinutes} min</span>
                    <span className="flex items-center gap-1"><BookOpen size={10} /> {s.sessionCount} sessions</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-black/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ background: s.color, width: `${Math.min((s.totalMinutes / 600) * 100, 100)}%` }}
                    />
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
