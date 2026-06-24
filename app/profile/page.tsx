"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AchievementGrid from "@/components/achievements/AchievementGrid";
import { motion, AnimatePresence } from "framer-motion";
import { User, Gem, Clock, BookOpen, Flame, GraduationCap, Mail, Calendar, Pencil, Save, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import type { AuthUser } from "@/hooks/useCurrentUser";

interface Stats {
  totalSessions: number; totalMinutes: number;
  currentStreak: number; longestStreak: number;
  totalRubies: number; unlockedBadgeIds: string[];
}

function deriveRank(totalSessions: number) {
  if (totalSessions >= 100) return { label:"Legend",    color:"#E63946" };
  if (totalSessions >= 50)  return { label:"Master",    color:"#D4A373" };
  if (totalSessions >= 10)  return { label:"Scholar",   color:"#4895EF" };
  return                           { label:"Beginner",  color:"#9B5DE5" };
}

const YEAR_OPTIONS = ["1st Year","2nd Year","3rd Year","4th Year","Postgraduate","Alumni"];

export default function ProfilePage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  // Extended user type with new profile fields
  const [profile, setProfile] = useState<AuthUser & {
    academicYear?: string; goals?: string; examTarget?: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "", college: "", department: "",
    academicYear: "", goals: "", examTarget: "",
  });

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { if (d && !d.error) setStats(d); });
  }, []);

  // Fetch full profile (includes new fields)
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d && !d.error) {
        setProfile(d);
        setForm({
          name:         d.name         ?? "",
          college:      d.college      ?? "",
          department:   d.department   ?? "",
          academicYear: d.academicYear ?? "",
          goals:        d.goals        ?? "",
          examTarget:   d.examTarget   ?? "",
        });
      }
    });
  }, []);

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save."); return; }
      setProfile(prev => prev ? { ...prev, ...form } : prev);
      setEditing(false);
      toast.success("Profile updated! ✓");
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  }

  function handleCancel() {
    setForm({
      name:         profile?.name         ?? "",
      college:      profile?.college      ?? "",
      department:   profile?.department   ?? "",
      academicYear: (profile as {academicYear?:string})?.academicYear ?? "",
      goals:        (profile as {goals?:string})?.goals               ?? "",
      examTarget:   (profile as {examTarget?:string})?.examTarget     ?? "",
    });
    setEditing(false);
  }

  const displayUser  = profile ?? user;
  const hours        = stats ? +(stats.totalMinutes / 60).toFixed(1) : 0;
  const { label: rankLabel, color: rankColor } = deriveRank(stats?.totalSessions ?? 0);
  const initial      = displayUser?.name?.[0]?.toUpperCase() ?? "?";
  const joined       = displayUser?.createdAt ? format(new Date(displayUser.createdAt), "MMMM yyyy") : "—";

  const INP = {
    className: "input-base",
    style: { background: "var(--warm-white)", fontSize: "0.9375rem" } as React.CSSProperties,
  };

  if (userLoading) return <DashboardLayout user={user}><div style={{ padding:40, textAlign:"center", color:"var(--text-tertiary)" }}>Loading…</div></DashboardLayout>;

  return (
    <DashboardLayout user={user} totalRubies={stats?.totalRubies ?? 0}>
      <Toaster position="top-right"/>
      <div style={{ padding:20, maxWidth:800, margin:"0 auto" }}>

        {/* ── Profile card ──────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:20, padding:24, marginBottom:20 }}>

          {/* Header row */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:20, flexShrink:0,
                background:"linear-gradient(135deg,var(--ruby),var(--ruby-dark))",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.75rem", fontWeight:900, color:"#fff" }}>{initial}</div>
              <div>
                <h1 style={{ fontSize:"1.375rem", fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>
                  {displayUser?.name ?? "…"}
                </h1>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:"0.75rem", fontWeight:700, padding:"2px 10px", borderRadius:99,
                    background:`${rankColor}15`, color:rankColor }}>{rankLabel}</span>
                  <span style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)" }}>· Joined {joined}</span>
                </div>
              </div>
            </div>

            {/* Edit / Save / Cancel */}
            {!editing ? (
              <button onClick={()=>setEditing(true)} className="btn btn-secondary" style={{ gap:6, fontSize:"0.875rem" }}>
                <Pencil size={13}/> Edit Profile
              </button>
            ) : (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ gap:6, fontSize:"0.875rem" }}>
                  <Save size={13}/> {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={handleCancel} className="btn btn-secondary" style={{ gap:6, fontSize:"0.875rem" }}>
                  <X size={13}/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* ── View mode ─────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.div key="view" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ display:"flex", flexDirection:"column", gap:8 }}>

                {[
                  { icon:<Mail size={14}/>,          label:"Email",            value: displayUser?.email                             },
                  { icon:<GraduationCap size={14}/>,  label:"College",          value: (profile as {college?:string})?.college        },
                  { icon:<BookOpen size={14}/>,       label:"Department",       value: (profile as {department?:string})?.department  },
                  { icon:<Calendar size={14}/>,       label:"Academic Year",    value: (profile as {academicYear?:string})?.academicYear },
                  { icon:<User size={14}/>,           label:"Study Goals",      value: (profile as {goals?:string})?.goals             },
                  { icon:<Gem size={14}/>,            label:"Target Exam",      value: (profile as {examTarget?:string})?.examTarget   },
                ].map(({ icon, label, value }) => value ? (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                    borderBottom:"1px solid var(--border)" }}>
                    <span style={{ color:"var(--text-tertiary)", flexShrink:0 }}>{icon}</span>
                    <span style={{ fontSize:"0.8125rem", color:"var(--text-tertiary)", width:110, flexShrink:0 }}>{label}</span>
                    <span style={{ fontSize:"0.9375rem", color:"var(--text-primary)", fontWeight:500 }}>{value}</span>
                  </div>
                ) : null)}
              </motion.div>
            ) : (
              /* ── Edit mode ─────────────────────────────── */
              <motion.div key="edit" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

                <Field label="Full Name *">
                  <input {...INP} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your full name"/>
                </Field>
                <Field label="College / University">
                  <input {...INP} value={form.college} onChange={e=>setForm(f=>({...f,college:e.target.value}))} placeholder="e.g. IIT Madras"/>
                </Field>
                <Field label="Department / Branch">
                  <input {...INP} value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} placeholder="e.g. CSE"/>
                </Field>
                <Field label="Academic Year">
                  <select {...INP} value={form.academicYear} onChange={e=>setForm(f=>({...f,academicYear:e.target.value}))}>
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
                <Field label="Study Goals">
                  <input {...INP} value={form.goals} onChange={e=>setForm(f=>({...f,goals:e.target.value}))} placeholder="e.g. GATE 2026, Placement"/>
                </Field>
                <Field label="Target Exam">
                  <input {...INP} value={form.examTarget} onChange={e=>setForm(f=>({...f,examTarget:e.target.value}))} placeholder="e.g. GATE CSE, CAT"/>
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stats chips ───────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:20 }}>
            {[
              { icon:<BookOpen size={16}/>, label:"Sessions",   value: stats?.totalSessions ?? 0,         color:"var(--ruby)"  },
              { icon:<Clock    size={16}/>, label:"Hours",       value: hours,                             color:"#4895EF"      },
              { icon:<Flame    size={16}/>, label:"Best Streak", value:`${stats?.longestStreak ?? 0}d`,    color:"var(--ruby)"  },
              { icon:<Gem      size={16}/>, label:"Rubies",      value: stats?.totalRubies ?? 0,           color:"#9B5DE5"      },
            ].map(({ icon, label, value, color }) => (
              <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:12,
                borderRadius:12, background:"rgba(255,255,255,0.6)", border:"1px solid var(--border)" }}>
                <span style={{ color, marginBottom:4 }}>{icon}</span>
                <p style={{ fontSize:"1.125rem", fontWeight:800, color:"var(--text-primary)" }}>{value}</p>
                <p style={{ fontSize:"0.6875rem", color:"var(--text-tertiary)" }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Achievements ──────────────────────────────────── */}
        <AchievementGrid unlockedIds={stats?.unlockedBadgeIds ?? []} />
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
