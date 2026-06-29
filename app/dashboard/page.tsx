"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import WelcomeHero from "@/components/dashboard/WelcomeHero";
import StatsGrid from "@/components/dashboard/StatsGrid";
import SessionForm from "@/components/dashboard/SessionForm";
import SessionList from "@/components/dashboard/SessionList";
import StudyChart from "@/components/charts/StudyChart";
import BrainCelebration from "@/components/brain/BrainCelebration";
import LoadingScreen from "@/components/ui/LoadingScreen";
import InsightsPanel from "@/components/insights/InsightsPanel";
import PinnedTimetableWidget, { type PinnedPlan } from "@/components/dashboard/PinnedTimetableWidget";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import AIMissionCard from "@/components/dashboard/AIMissionCard";
import AgentPanel from "@/components/dashboard/AgentPanel";
import AnalyticsWidgets from "@/components/dashboard/AnalyticsWidgets";
import SubjectsWidget from "@/components/dashboard/SubjectsWidget";
import DailyMotivation from "@/components/dashboard/DailyMotivation";
import type { Analytics } from "@/app/api/analytics/route";
import type { AgentStateData } from "@/components/dashboard/AIMissionCard";
import { triggerRubyReward } from "@/hooks/useRubyReward";

/* ── Types ─────────────────────────────────────────────────── */
interface AuthUser { _id:string; name:string; email:string; }
interface StudySession { _id:string; subject:string; duration:number; date:string; notes?:string; completed:boolean; }
interface Stats {
  totalSessions:number; totalMinutes:number;
  currentStreak:number; longestStreak:number; totalRubies:number;
  weekGrid:boolean[]; unlockedBadgeIds:string[];
  chart:{ labels:string[]; data:number[] };
  subjectBreakdown:Record<string,number>;
}
interface Challenge { title:string; description:string; target:number; unit:string; progress:number; completed:boolean; rubyReward:number; }
interface LeaderboardEntry { rank:number; username:string; hoursStudied:number; totalSessions:number; totalRubies:number; streak:number; isCurrentUser?:boolean; }

const EMPTY_STATS: Stats = {
  totalSessions:0, totalMinutes:0, currentStreak:0, longestStreak:0, totalRubies:0,
  weekGrid:Array(7).fill(false), unlockedBadgeIds:[],
  chart:{ labels:[], data:[] }, subjectBreakdown:{},
};

const DAILY_GOAL = 120;

export default function DashboardPage() {
  const [loading,         setLoading]         = useState(true);
  const [authUser,        setAuthUser]        = useState<AuthUser | null>(null);
  const [sessions,        setSessions]        = useState<StudySession[]>([]);
  const [stats,           setStats]           = useState<Stats>(EMPTY_STATS);
  const [challenge,       setChallenge]       = useState<Challenge|null>(null);
  const [leaderboard,     setLeaderboard]     = useState<LeaderboardEntry[]>([]);
  const [editingSession,  setEditingSession]  = useState<StudySession|null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [studyActive,     setStudyActive]     = useState(false);
  const [pinnedPlan,      setPinnedPlan]      = useState<PinnedPlan | null>(null);
  const [analytics,       setAnalytics]       = useState<Analytics | null>(null);
  /* Agent state — loaded separately so it doesn't block the rest of the dashboard */
  const [agentState,      setAgentState]      = useState<AgentStateData | null>(null);
  const prevCelebrated  = useRef(false);
  /* Track previous ruby total — fire animation when it increases
     (covers streak milestones, 100h club, challenge rewards, etc.) */
  const prevRubies      = useRef<number | null>(null);

  const todayMinutes = sessions.filter(s => {
    const d = new Date(s.date); const t = new Date();
    return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
  }).reduce((a,s)=>a+s.duration,0);

  const brainProgress = Math.min(Math.round((todayMinutes/DAILY_GOAL)*100),100);

  /* ── Fetchers ─────────────────────────────────────────────── */
  const fetchUser        = useCallback(async()=>{ const r=await fetch("/api/auth/me");     if(!r.ok) return; const d:unknown=await r.json(); if(d&&typeof d==="object") setAuthUser(d as AuthUser); },[]);
  const fetchSessions    = useCallback(async()=>{ const r=await fetch("/api/sessions");    if(!r.ok) return; const d:unknown=await r.json(); setSessions(Array.isArray(d)?d as StudySession[]:[]);  },[]);
  const fetchStats       = useCallback(async()=>{ const r=await fetch("/api/stats");       if(!r.ok) return; const d:unknown=await r.json(); if(d&&typeof d==="object") setStats(d as Stats); },[]);
  const fetchChallenge   = useCallback(async()=>{ const r=await fetch("/api/challenges");  if(!r.ok) return; const d:unknown=await r.json(); if(d&&typeof d==="object") setChallenge(d as Challenge); },[]);
  const fetchLeaderboard = useCallback(async()=>{ const r=await fetch("/api/leaderboard"); if(!r.ok) return; const d:unknown=await r.json(); if(Array.isArray(d)) setLeaderboard(d as LeaderboardEntry[]); },[]);
  const fetchAnalytics   = useCallback(async()=>{ const r=await fetch("/api/analytics");   if(!r.ok) return; const d: Analytics | null=await r.json(); if(d&&!("error"in d)) setAnalytics(d); },[]);
  const fetchPinnedPlan  = useCallback(async()=>{
    const r = await fetch("/api/timetable");
    if (!r.ok) return;
    const d: PinnedPlan | null = await r.json();
    setPinnedPlan(d);
  },[]);

  /* Agent state is fetched independently by AIMissionCard, but we also
     poll it here so AgentPanel in the right sidebar gets the data */
  const fetchAgentState  = useCallback(async()=>{
    const r = await fetch("/api/agent/state");
    if (!r.ok) return;
    const d: AgentStateData | null = await r.json();
    if (d && !("error" in d)) setAgentState(d);
  },[]);

  const refreshAll = useCallback(async()=>{
    await Promise.all([fetchSessions(), fetchStats(), fetchChallenge(), fetchLeaderboard(), fetchAnalytics()]);
  },[fetchSessions, fetchStats, fetchChallenge, fetchLeaderboard, fetchAnalytics]);

  useEffect(()=>{ fetchUser(); fetchPinnedPlan(); fetchAgentState(); },[fetchUser, fetchPinnedPlan, fetchAgentState]);
  useEffect(()=>{ refreshAll(); },[refreshAll]);

  useEffect(()=>{
    if(brainProgress>=100 && !prevCelebrated.current){ prevCelebrated.current=true; setTimeout(()=>setShowCelebration(true),600); }
    if(brainProgress<100) prevCelebrated.current=false;
  },[brainProgress]);

  /* Detect ruby increases from streak milestones, challenges, 100h badge, etc.
     SessionForm already triggers for +1 (optimistic), so skip delta of 1
     to avoid a double animation on basic session logs. */
  useEffect(()=>{
    const current = stats.totalRubies;
    if (prevRubies.current !== null && current > prevRubies.current) {
      const delta = current - prevRubies.current;
      if (delta > 1) {
        // Large delta = milestone bonus (7-day +10, 30-day +50, 100h +100, etc.)
        triggerRubyReward({ amount: delta });
      }
    }
    prevRubies.current = current;
  },[stats.totalRubies]);

  async function handleSessionSaved(){
    setEditingSession(null);
    setStudyActive(true);
    setTimeout(()=>setStudyActive(false),3000);
    await refreshAll();
  }

  return (
    <>
      {/* Daily motivation — shown once per day, fades in after 800ms */}
      <DailyMotivation/>

      <AnimatePresence>
        {loading && <LoadingScreen onDone={()=>setLoading(false)} />}
      </AnimatePresence>

      <BrainCelebration
        show={showCelebration}
        rubiesEarned={stats.totalRubies}
        onDismiss={()=>setShowCelebration(false)}
      />

      {!loading && (
        <DashboardLayout
          user={authUser}
          totalRubies={stats.totalRubies}
          currentStreak={stats.currentStreak}
          brainProgress={brainProgress}
          studyActive={studyActive}
          rightPanel={
            <>
              <AgentPanel state={agentState}/>
              <InsightsPanel
                leaderboard={leaderboard}
                unlockedBadgeIds={stats.unlockedBadgeIds}
                challenge={challenge}
              />
            </>
          }
        >
          <div className="page-container" style={{ maxWidth: 860 }}>

            {/* Welcome hero */}
            <WelcomeHero
              currentStreak={stats.currentStreak}
              totalMinutes={stats.totalMinutes}
              brainProgress={brainProgress}
              totalRubies={stats.totalRubies}
            />

            {/* ── TODAY'S AI MISSION (Agentic — Groq-powered) ── */}
            <AIMissionCard
              onRebalanced={() => { fetchPinnedPlan(); fetchAgentState(); }}
            />

            {/* ── Rule-based AI insight (instant, no Groq) ─── */}
            {analytics && <AIInsightCard analytics={analytics} />}

            {/* Pinned AI study plan (if any) */}
            {pinnedPlan && (
              <PinnedTimetableWidget plan={pinnedPlan} onRemoved={()=>setPinnedPlan(null)}/>
            )}

            {/* Stats grid */}
            <StatsGrid stats={stats} />

            {/* Subjects manager */}
            <SubjectsWidget onChanged={refreshAll}/>

            {/* Analytics widgets */}
            {analytics && analytics.totalSessions > 0 && (
              <AnalyticsWidgets analytics={analytics} pinnedPlan={pinnedPlan}/>
            )}

            {/* ── Mobile-only inline panels ────────────────────────
                Shown here (after analytics) only on < 1280px screens.
                On 1280px+ they are hidden here and show in the aside.
                No duplicate rendering issue — CSS display:none removes
                them from layout while keeping one DOM instance.          */}
            <div className="db-panel-inline">
              <AgentPanel state={agentState}/>
              <InsightsPanel
                leaderboard={leaderboard}
                unlockedBadgeIds={stats.unlockedBadgeIds}
                challenge={challenge}
              />
            </div>

            {/* Charts */}
            <StudyChart
              labels={stats.chart.labels}
              data={stats.chart.data}
              subjectBreakdown={stats.subjectBreakdown}
            />

            {/* Session management — stacks to single column below 900px */}
            <div className="session-layout">
              <SessionForm
                editingSession={editingSession}
                onSaved={handleSessionSaved}
                onCancelEdit={()=>setEditingSession(null)}
              />
              <SessionList
                sessions={sessions}
                onEdit={s=>{ setEditingSession(s); window.scrollTo({top:0,behavior:"smooth"}); }}
                onRefresh={refreshAll}
              />
            </div>

          </div>
        </DashboardLayout>
      )}
    </>
  );
}
