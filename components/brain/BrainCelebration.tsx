"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gem } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

interface BrainCelebrationProps {
  show: boolean;
  rubiesEarned?: number;
  onDismiss: () => void;
}

interface Particle { id:number; x:number; y:number; vx:number; vy:number; color:string; size:number; shape:"circle"|"rect"; }

const CONFETTI_COLORS = ["#E63946","#D4A373","#FFD700","#FF6B6B","#FFFFFF","#FF8C00","#52B788","#4895EF"];

export default function BrainCelebration({ show, rubiesEarned = 0, onDismiss }: BrainCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase,     setPhase]     = useState<"crack"|"explode"|"reward"|"done">("crack");
  const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

  useEffect(() => {
    if (!show) { setPhase("crack"); return; }

    // Phase 1: crack (0-600ms)
    setPhase("crack");
    const t1 = setTimeout(() => setPhase("explode"), 600);

    // Phase 2: explode — emit particles
    const t2 = setTimeout(() => {
      const burst: Particle[] = Array.from({ length: 80 }, (_, i) => {
        const angle = (i / 80) * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        return {
          id: i,
          x: 50, y: 45,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          size: 4 + Math.random() * 8,
          shape: Math.random() > 0.5 ? "circle" : "rect",
        };
      });
      setParticles(burst);
    }, 600);

    // Phase 3: reward card
    const t3 = setTimeout(() => setPhase("reward"), 1000);

    // Auto dismiss
    const t4 = setTimeout(onDismiss, 6500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          onClick={onDismiss}
          style={{
            position:"fixed", inset:0, zIndex:100,
            background:"rgba(10,8,6,0.88)",
            backdropFilter:"blur(10px)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              style={{
                position:"absolute",
                left:`${p.x}%`, top:`${p.y}%`,
                width:p.size, height:p.shape==="rect"?p.size*0.5:p.size,
                borderRadius:p.shape==="circle"?"50%":"2px",
                background:p.color,
                pointerEvents:"none",
              }}
              animate={{
                x: p.vx * 120,
                y: p.vy * 120 + 200,
                opacity: [1, 1, 0],
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 2.5, ease:"easeOut" }}
            />
          ))}

          {/* Main celebration card */}
          <motion.div
            initial={{ scale:0.4, opacity:0, y:60 }}
            animate={{ scale:1, opacity:1, y:0 }}
            exit={{ scale:0.85, opacity:0 }}
            transition={{ type:"spring", stiffness:200, damping:18, delay:0.15 }}
            onClick={e => e.stopPropagation()}
            style={{
              background:"#1D1D1D",
              borderRadius:"var(--r-2xl)",
              border:"1px solid rgba(255,255,255,0.1)",
              padding:"40px 36px",
              maxWidth:380, width:"90%",
              textAlign:"center",
              position:"relative",
              overflow:"hidden",
            }}
          >
            {/* Background glow */}
            <motion.div
              animate={{ scale:[1,1.3,1], opacity:[0.3,0.6,0.3] }}
              transition={{ duration:2, repeat:Infinity }}
              style={{
                position:"absolute", inset:0, borderRadius:"var(--r-2xl)",
                background:"radial-gradient(ellipse at 50% 30%, rgba(230,57,70,0.2), transparent 65%)",
                pointerEvents:"none",
              }}
            />

            {/* Crack phase brain */}
            {phase === "crack" && (
              <motion.div
                animate={{ scale:[1,1.2,0.9,1.3], filter:["brightness(1)","brightness(3)","brightness(1)"] }}
                transition={{ duration:0.6 }}
                style={{ fontSize:80, lineHeight:1, marginBottom:16 }}
              >🧠</motion.div>
            )}

            {/* Explode / reward phase */}
            {(phase === "explode" || phase === "reward") && (
              <>
                {/* Trophy */}
                <motion.div
                  initial={{ scale:0, rotate:-20 }}
                  animate={{ scale:1, rotate:0 }}
                  transition={{ type:"spring", stiffness:300, damping:15, delay:0.1 }}
                  style={{
                    width:80, height:80, borderRadius:24,
                    background:"linear-gradient(135deg, #FFD700, #D4A373)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 20px",
                    boxShadow:"0 0 40px rgba(255,215,0,0.5)",
                  }}
                >
                  <Trophy size={38} color="#fff" />
                </motion.div>

                {/* Stars */}
                <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:16 }}>
                  {[0,1,2,3,4].map(i => (
                    <motion.span key={i} initial={{ scale:0 }} animate={{ scale:1 }}
                      transition={{ delay:0.2+i*0.07, type:"spring", stiffness:400 }}
                      style={{ fontSize:18 }}>⭐</motion.span>
                  ))}
                </div>

                <motion.h2
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
                  style={{ fontSize:"1.625rem", fontWeight:800, color:"#FFFFFF", letterSpacing:"-0.03em", marginBottom:6 }}
                >
                  Knowledge Unlocked!
                </motion.h2>

                <motion.p
                  initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                  style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.45)", marginBottom:20 }}
                >
                  Daily goal complete · You studied longer than 87% of learners today.
                </motion.p>

                {/* Ruby reward */}
                {rubiesEarned > 0 && (
                  <motion.div
                    initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.6 }}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                      background:"rgba(230,57,70,0.12)", borderRadius:"var(--r-lg)",
                      padding:"12px 20px", marginBottom:20,
                      border:"1px solid rgba(230,57,70,0.2)",
                    }}
                  >
                    <motion.div animate={{ rotate:[0,15,-15,0], scale:[1,1.2,1] }} transition={{ duration:1.5, repeat:Infinity }}>
                      <Gem size={22} color="#E63946" />
                    </motion.div>
                    <span style={{ fontSize:"1.25rem", fontWeight:800, color:"#E63946" }}>+{rubiesEarned} Rubies</span>
                  </motion.div>
                )}

                {/* Quote */}
                <motion.p
                  initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
                  style={{ fontSize:"0.8125rem", fontStyle:"italic", color:"rgba(255,255,255,0.4)", marginBottom:24, lineHeight:1.5 }}
                >
                  &ldquo;{quote}&rdquo;
                </motion.p>

                <motion.button
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={onDismiss}
                  className="btn btn-primary"
                  style={{ width:"100%", fontSize:"0.9375rem" }}
                >
                  Continue Studying 🚀
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
