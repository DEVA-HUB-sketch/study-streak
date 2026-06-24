"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Target, Bot, Gem, Flame, BookOpen, Lock, CheckCircle2 } from "lucide-react";
import { BADGES, DAILY_AI_MESSAGES } from "@/lib/constants";

/* ── Types ─────────────────────────────────────────────────── */
interface LeaderboardEntry {
  rank:number; username:string; hoursStudied:number;
  totalSessions:number; totalRubies:number; streak:number; isCurrentUser?:boolean;
}
interface Challenge {
  title:string; description:string; target:number;
  unit:string; progress:number; completed:boolean; rubyReward:number;
}
interface InsightsPanelProps {
  leaderboard: LeaderboardEntry[];
  unlockedBadgeIds: string[];
  challenge: Challenge | null;
}

/* ── Leaderboard ────────────────────────────────────────────── */
function LeaderboardCard({ entries }: { entries:LeaderboardEntry[] }) {
  const medals = ["🥇","🥈","🥉"];
  return (
    <div className="card card-sm">
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <Trophy size={15} color="var(--gold)" />
        <h3 className="t-h3" style={{ fontSize:"0.9375rem" }}>Leaderboard</h3>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {(entries.length ? entries : [{ rank:1,username:"Future Achiever",hoursStudied:0,totalSessions:0,totalRubies:0,streak:0,isCurrentUser:true }]).map((e,i)=>(
          <div key={e.rank} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"8px 10px", borderRadius:"var(--r-md)",
            background: e.isCurrentUser ? "var(--ruby-dim)" : i%2===0?"var(--cream)":"transparent",
            border: e.isCurrentUser ? "1px solid rgba(230,57,70,0.15)" : "1px solid transparent",
          }}>
            <span style={{ width:22, textAlign:"center", fontSize:i<3?"1rem":"0.8125rem", fontWeight:700,
              color:i<3?"inherit":"var(--text-tertiary)" }}>
              {i<3?medals[i]:e.rank}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {e.username} {e.isCurrentUser && <span style={{ color:"var(--ruby)", fontSize:"0.6875rem" }}>← You</span>}
              </p>
              <div style={{ display:"flex", gap:8, marginTop:1 }}>
                <span style={{ fontSize:"0.6875rem", color:"var(--text-tertiary)" }}>⏱ {e.hoursStudied}h</span>
                <span style={{ fontSize:"0.6875rem", color:"var(--text-tertiary)" }}>🔥 {e.streak}d</span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
              <Gem size={10} color="#9B5DE5"/>
              <span style={{ fontSize:"0.8125rem", fontWeight:700, color:"#9B5DE5" }}>{e.totalRubies}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Achievements ───────────────────────────────────────────── */
function AchievementsCard({ unlockedIds }: { unlockedIds:string[] }) {
  const display = BADGES.slice(0,6);
  return (
    <div className="card card-sm">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Medal size={15} color="var(--gold)" />
          <h3 className="t-h3" style={{ fontSize:"0.9375rem" }}>Achievements</h3>
        </div>
        <span className="badge badge-gold" style={{ fontSize:"0.6875rem" }}>
          {unlockedIds.length}/{BADGES.length}
        </span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {display.map((badge,i)=>{
          const unlocked = unlockedIds.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity:0, scale:0.85 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay:i*0.05 }}
              title={badge.name}
              style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                padding:"10px 6px", borderRadius:"var(--r-md)", textAlign:"center",
                background: unlocked ? `${badge.color}12` : "var(--cream)",
                border:`1px solid ${unlocked?`${badge.color}25`:"var(--border)"}`,
                position:"relative", cursor:"default",
                filter: unlocked?"none":"grayscale(1)",
                opacity: unlocked?1:0.5,
              }}
            >
              <span style={{ fontSize:"1.375rem", lineHeight:1, marginBottom:4 }}>{badge.icon}</span>
              <span style={{ fontSize:"0.5625rem", fontWeight:600, color:"var(--text-secondary)", lineHeight:1.2 }}>
                {badge.name}
              </span>
              {!unlocked && (
                <div style={{ position:"absolute", top:4, right:4 }}>
                  <Lock size={9} color="var(--text-tertiary)" />
                </div>
              )}
              {unlocked && (
                <div style={{ position:"absolute", top:-4, right:-4, background:badge.color, borderRadius:"50%", width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:"8px", color:"#fff" }}>✓</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Daily Challenge ────────────────────────────────────────── */
function ChallengeCard({ challenge }: { challenge:Challenge|null }) {
  if (!challenge) return null;
  const pct = Math.min((challenge.progress/challenge.target)*100,100);
  return (
    <div className="card card-sm accent-gold">
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <Target size={15} color="var(--gold)" />
        <h3 className="t-h3" style={{ fontSize:"0.9375rem" }}>Daily Challenge</h3>
        {challenge.completed && <CheckCircle2 size={14} color="#52B788" style={{ marginLeft:"auto" }} />}
      </div>
      <p style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:4 }}>
        {challenge.title}
      </p>
      <p style={{ fontSize:"0.8125rem", color:"var(--text-secondary)", marginBottom:12, lineHeight:1.4 }}>
        {challenge.description}
      </p>
      <div className="progress-track" style={{ marginBottom:8 }}>
        <motion.div
          className="progress-fill"
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ duration:0.8, ease:"easeOut" }}
          style={{ background: challenge.completed ? "linear-gradient(90deg,#52B788,#40916C)" : "linear-gradient(90deg,var(--gold),var(--gold-light))" }}
        />
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"0.75rem", color:"var(--text-tertiary)" }}>
          {challenge.progress} / {challenge.target} {challenge.unit}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Gem size={11} color="var(--ruby)" />
          <span style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--ruby)" }}>+{challenge.rubyReward}</span>
        </div>
      </div>
    </div>
  );
}

/* ── AI Motivation ──────────────────────────────────────────── */
function AIMotivationCard() {
  const msg = DAILY_AI_MESSAGES[new Date().getDate() % DAILY_AI_MESSAGES.length];
  return (
    <div style={{
      borderRadius:"var(--r-xl)",
      background:"var(--charcoal)",
      padding:18, position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", top:-20, right:-20, width:80, height:80,
        borderRadius:"50%", background:"radial-gradient(circle,rgba(230,57,70,0.2),transparent 70%)",
        pointerEvents:"none",
      }}/>
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"rgba(230,57,70,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Bot size={14} color="var(--ruby)" />
          </div>
          <span style={{ fontSize:"0.75rem", fontWeight:600, color:"rgba(255,255,255,0.5)", letterSpacing:"0.05em", textTransform:"uppercase" }}>
            AI Motivation
          </span>
        </div>
        <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", lineHeight:1.55, fontStyle:"italic" }}>
          &ldquo;{msg}&rdquo;
        </p>
        <p style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.25)", marginTop:10 }}>— Your Study Companion</p>
      </div>
    </div>
  );
}

/* ── Composite panel ─────────────────────────────────────────── */
export default function InsightsPanel({ leaderboard, unlockedBadgeIds, challenge }: InsightsPanelProps) {
  return (
    <>
      <LeaderboardCard entries={leaderboard} />
      <AchievementsCard unlockedIds={unlockedBadgeIds} />
      <ChallengeCard challenge={challenge} />
      <AIMotivationCard />
    </>
  );
}
