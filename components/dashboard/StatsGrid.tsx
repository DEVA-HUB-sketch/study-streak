"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Clock, Flame, Trophy, Gem } from "lucide-react";

interface Stats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalRubies: number;
}

function AnimatedNumber({ target }: { target: number }) {
  const ref  = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once:true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 900;
    const step = 16;
    const increment = target / (duration / step);
    const id = setInterval(() => {
      start = Math.min(start + increment, target);
      setVal(Math.round(start));
      if (start >= target) clearInterval(id);
    }, step);
    return () => clearInterval(id);
  }, [inView, target]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

const CARDS = [
  { key:"totalSessions" as const, label:"Total Sessions", Icon:BookOpen, accent:"accent-ruby",   iconBg:"rgba(230,57,70,0.1)",  iconColor:"var(--ruby)",   unit:"" },
  { key:"totalMinutes"  as const, label:"Study Minutes",  Icon:Clock,    accent:"accent-blue",   iconBg:"rgba(72,149,239,0.1)", iconColor:"#4895EF",       unit:"min" },
  { key:"currentStreak" as const, label:"Current Streak", Icon:Flame,    accent:"accent-ruby",   iconBg:"rgba(230,57,70,0.1)",  iconColor:"var(--ruby)",   unit:"days" },
  { key:"longestStreak" as const, label:"Best Streak",    Icon:Trophy,   accent:"accent-gold",   iconBg:"var(--gold-dim)",     iconColor:"var(--gold)",   unit:"days" },
  { key:"totalRubies"   as const, label:"Rubies Earned",  Icon:Gem,      accent:"accent-purple", iconBg:"rgba(155,93,229,0.1)","iconColor":"#9B5DE5",     unit:"" },
] as const;

export default function StatsGrid({ stats }: { stats: Stats }) {
  return (
    <div className="stats-grid-mobile"
      style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
      {CARDS.map(({ key, label, Icon, accent, iconBg, iconColor, unit }, i) => (
        <motion.div
          key={key}
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:i*0.07, duration:0.35 }}
          whileHover={{ y:-2, boxShadow:"var(--shadow-md)" }}
          className={`card card-sm card-hover ${accent}`}
        >
          <div style={{
            width:36, height:36, borderRadius:"var(--r-sm)",
            background:iconBg, display:"flex", alignItems:"center",
            justifyContent:"center", marginBottom:12,
          }}>
            <Icon size={17} color={iconColor} />
          </div>

          <p style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--text-primary)", lineHeight:1, marginBottom:4 }}>
            <AnimatedNumber target={stats[key]} />
            {unit && <span style={{ fontSize:"0.75rem", fontWeight:500, color:"var(--text-tertiary)", marginLeft:3 }}>{unit}</span>}
          </p>
          <p style={{ fontSize:"0.75rem", color:"var(--text-tertiary)", fontWeight:500 }}>{label}</p>
        </motion.div>
      ))}
    </div>
  );
}
