"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Target, Gem } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

interface WelcomeHeroProps {
  currentStreak: number;
  totalMinutes: number;
  brainProgress: number;
  totalRubies: number;
}

export default function WelcomeHero({ currentStreak, totalMinutes, brainProgress, totalRubies }: WelcomeHeroProps) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  }, []);

  const quote = useMemo(() => MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length], []);
  const hours = (totalMinutes / 60).toFixed(1);

  return (
    <motion.div
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }}
      className="card"
      style={{ position:"relative", overflow:"hidden", marginBottom:0 }}
    >
      {/* Decorative background shapes */}
      <div style={{
        position:"absolute", top:-40, right:-40, width:180, height:180,
        borderRadius:"50%", background:"radial-gradient(circle, rgba(230,57,70,0.07), transparent 70%)",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:-30, left:100, width:120, height:120,
        borderRadius:"50%", background:"radial-gradient(circle, rgba(212,163,115,0.06), transparent 70%)",
        pointerEvents:"none",
      }}/>

      <div style={{ position:"relative", zIndex:1 }}>
        {/* Greeting + quote */}
        <div style={{ marginBottom:20 }}>
          <span className="badge badge-ruby" style={{ marginBottom:10, display:"inline-flex" }}>
            ✦ {greeting}
          </span>
          <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:6 }}>
            Welcome back, <span style={{ color:"var(--ruby)" }}>Future Achiever!</span>
          </h1>
          <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", fontStyle:"italic", lineHeight:1.5 }}>
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        {/* Daily goal bar */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Target size={14} color="var(--ruby)" />
              <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-primary)" }}>
                Daily Goal Progress
              </span>
            </div>
            <span style={{ fontSize:"0.8125rem", fontWeight:700, color:"var(--ruby)" }}>
              {brainProgress}%
            </span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width:0 }}
              animate={{ width:`${brainProgress}%` }}
              transition={{ duration:1, ease:"easeOut", delay:0.3 }}
            />
          </div>
          <p style={{ fontSize:"0.6875rem", color:"var(--text-tertiary)", marginTop:5 }}>
            {Math.round((brainProgress / 100) * 120)} / 120 min studied today
          </p>
        </div>

        {/* Quick stats row */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {[
            { icon:<Flame size={14} color="#E63946"/>, label:`${currentStreak} day streak`, color:"rgba(230,57,70,0.1)", textColor:"#E63946" },
            { icon:<span style={{fontSize:14}}>⏱</span>, label:`${hours}h total`, color:"rgba(72,149,239,0.1)", textColor:"#4895EF" },
            { icon:<Gem size={14} color="#9B5DE5"/>, label:`${totalRubies} rubies`, color:"rgba(155,93,229,0.1)", textColor:"#9B5DE5" },
          ].map(({ icon, label, color, textColor }) => (
            <div key={label} style={{
              display:"flex", alignItems:"center", gap:6,
              background:color, borderRadius:"var(--r-sm)",
              padding:"5px 10px",
            }}>
              {icon}
              <span style={{ fontSize:"0.8125rem", fontWeight:600, color:textColor }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
