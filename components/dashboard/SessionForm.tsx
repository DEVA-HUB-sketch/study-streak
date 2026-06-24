"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Save, X } from "lucide-react";
import toast from "react-hot-toast";

interface StudySession { _id:string; subject:string; duration:number; date:string; notes?:string; }
interface Subject { _id:string; name:string; color:string; icon:string; }
interface SessionFormProps {
  editingSession: StudySession | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}

const EMPTY = { subject:"", duration:"", date:"", notes:"" };

export default function SessionForm({ editingSession, onSaved, onCancelEdit }: SessionFormProps) {
  const [form,     setForm]     = useState(EMPTY);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    fetch("/api/subjects").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setSubjects(d); });
  }, []);

  useEffect(() => {
    setForm(editingSession
      ? { subject:editingSession.subject, duration:String(editingSession.duration), date:editingSession.date.slice(0,10), notes:editingSession.notes||"" }
      : EMPTY
    );
  }, [editingSession]);

  const set = (k:keyof typeof EMPTY) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f=>({...f,[k]:e.target.value}));

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { subject:form.subject, duration:Number(form.duration), date:form.date, notes:form.notes };
      const res = await fetch(
        editingSession ? `/api/sessions/${editingSession._id}` : "/api/sessions",
        { method: editingSession?"PUT":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) }
      );
      if (!res.ok) throw new Error("Save failed");
      toast.success(editingSession ? "Session updated!" : "Session logged! +1 Ruby 💎");
      setForm(EMPTY);
      onSaved();
    } catch { toast.error("Failed to save session."); }
    finally { setSaving(false); }
  }

  return (
    <div className="card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <h3 className="t-h3" style={{ color:"var(--text-primary)" }}>
          {editingSession ? "Edit Session" : "Log Study Session"}
        </h3>
        {editingSession && (
          <button onClick={onCancelEdit} className="btn btn-ghost btn-icon btn-sm">
            <X size={15} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {/* Subject */}
        <div>
          <label className="t-caption" style={{ color:"var(--text-tertiary)", display:"block", marginBottom:5 }}>Subject</label>
          {subjects.length > 0 ? (
            <select value={form.subject} onChange={set("subject")} required className="input-base">
              <option value="">Choose subject…</option>
              {subjects.map(s=>(
                <option key={s._id} value={s.name}>{s.icon} {s.name}</option>
              ))}
              <option value="Other">+ Other</option>
            </select>
          ) : (
            <input value={form.subject} onChange={set("subject")} placeholder="e.g. Mathematics" required className="input-base" />
          )}
          {form.subject === "Other" && (
            <input
              value="" onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
              placeholder="Enter subject name" autoFocus required
              className="input-base" style={{ marginTop:8 }}
            />
          )}
        </div>

        {/* Duration + Date */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label className="t-caption" style={{ color:"var(--text-tertiary)", display:"block", marginBottom:5 }}>Duration (min)</label>
            <input type="number" min="1" value={form.duration} onChange={set("duration")} placeholder="60" required className="input-base" />
          </div>
          <div>
            <label className="t-caption" style={{ color:"var(--text-tertiary)", display:"block", marginBottom:5 }}>Date</label>
            <input type="date" value={form.date} onChange={set("date")} required className="input-base" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="t-caption" style={{ color:"var(--text-tertiary)", display:"block", marginBottom:5 }}>Notes (optional)</label>
          <textarea
            value={form.notes} onChange={set("notes")} rows={2}
            placeholder="What did you cover today?"
            className="input-base" style={{ resize:"none" }}
          />
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, paddingTop:4 }}>
          <motion.button
            type="submit" disabled={saving}
            whileHover={!saving?{scale:1.01}:{}} whileTap={!saving?{scale:0.98}:{}}
            className="btn btn-primary"
            style={{ flex:1 }}
          >
            {saving
              ? <span style={{ display:"flex", alignItems:"center", gap:8 }}><span className="animate-spin" style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block" }}/> Saving…</span>
              : editingSession
                ? <><Save size={14}/> Update Session</>
                : <><Plus size={14}/> Log Session</>
            }
          </motion.button>
        </div>
      </form>
    </div>
  );
}
