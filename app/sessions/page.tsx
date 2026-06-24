"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Flame, BarChart2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionForm from "@/components/dashboard/SessionForm";
import SessionList from "@/components/dashboard/SessionList";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface StudySession {
  _id: string; subject: string; duration: number;
  date: string; notes?: string; completed: boolean;
}

function StatChip({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
      background:"var(--cream)", border:"1px solid var(--border)", borderRadius:14 }}>
      <span style={{ color }}>{icon}</span>
      <div>
        <p style={{ fontSize:"1.125rem", fontWeight:800, color:"var(--text-primary)", lineHeight:1 }}>{value}</p>
        <p style={{ fontSize:"0.6875rem", color:"var(--text-tertiary)", marginTop:2 }}>{label}</p>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { user }                          = useCurrentUser();
  const [sessions, setSessions]           = useState<StudySession[]>([]);
  const [totalRubies, setTotalRubies]     = useState(0);
  const [currentStreak, setStreak]        = useState(0);
  const [editingSession, setEditing]      = useState<StudySession | null>(null);

  const fetchSessions = useCallback(async () => {
    const r = await fetch("/api/sessions");
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d)) setSessions(d as StudySession[]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const r = await fetch("/api/stats");
    if (r.ok) {
      const d = await r.json();
      if (d) { setTotalRubies(d.totalRubies ?? 0); setStreak(d.currentStreak ?? 0); }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchSessions(), fetchStats()]);
  }, [fetchSessions, fetchStats]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  /* Derived stats */
  const totalMinutes  = sessions.reduce((a, s) => a + s.duration, 0);
  const totalHours    = +(totalMinutes / 60).toFixed(1);
  const subjectCount  = new Set(sessions.map(s => s.subject)).size;

  async function handleSaved() {
    setEditing(null);
    await refreshAll();
  }

  return (
    <DashboardLayout user={user} totalRubies={totalRubies} currentStreak={currentStreak}>
      <div style={{ padding:24, maxWidth:960, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <BookOpen size={20} color="var(--ruby)"/>
            <h1 style={{ fontSize:"1.375rem", fontWeight:800, letterSpacing:"-0.03em", color:"var(--text-primary)" }}>
              Study Sessions
            </h1>
          </div>
          <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>
            Log, track and review all your study sessions in one place.
          </p>
        </motion.div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
          <StatChip icon={<BookOpen size={16}/>} label="Total Sessions"  value={sessions.length} color="var(--ruby)"/>
          <StatChip icon={<Clock    size={16}/>} label="Total Hours"     value={`${totalHours}h`} color="#4895EF"/>
          <StatChip icon={<Flame    size={16}/>} label="Current Streak"  value={`${currentStreak}d`} color="#F4A261"/>
          <StatChip icon={<BarChart2 size={16}/>}label="Subjects Studied" value={subjectCount} color="#9B5DE5"/>
        </div>

        {/* Log + History */}
        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:20, alignItems:"start" }}>
          <SessionForm
            editingSession={editingSession}
            onSaved={handleSaved}
            onCancelEdit={()=>setEditing(null)}
          />
          <SessionList
            sessions={sessions}
            onEdit={s=>{ setEditing(s); window.scrollTo({ top:0, behavior:"smooth" }); }}
            onRefresh={refreshAll}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}
