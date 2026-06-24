"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

const QUOTES = [
  "The beautiful thing about learning is nobody can take it away from you.",
  "Success is the sum of small efforts repeated daily.",
  "Every study session builds your future.",
  ...MOTIVATIONAL_QUOTES.slice(0,4),
];

export default function LoadingScreen({ onDone }: { onDone:()=>void }) {
  const [progress, setProgress]   = useState(0);
  const [quoteIdx, setQuoteIdx]   = useState(0);

  useEffect(() => {
    // Progress ticker
    const tick = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(tick); setTimeout(onDone, 300); return 100; }
        return p + 2;
      });
    }, 40);

    // Quote rotation
    const qr = setInterval(() => setQuoteIdx(i => (i+1) % QUOTES.length), 2000);

    return () => { clearInterval(tick); clearInterval(qr); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity:1 }}
      exit={{ opacity:0, scale:0.98, transition:{ duration:0.4 } }}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"var(--charcoal)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:0,
      }}
    >
      {/* Background glow */}
      <div style={{
        position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)",
        width:400, height:400, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(230,57,70,0.08),transparent 70%)",
        filter:"blur(40px)", pointerEvents:"none",
      }}/>

      {/* Gem icon */}
      <motion.div
        animate={{ rotate:360, scale:[1,1.1,1] }}
        transition={{ rotate:{ duration:3.5,repeat:Infinity,ease:"linear" }, scale:{ duration:2,repeat:Infinity } }}
        style={{
          width:72, height:72, borderRadius:20,
          background:"linear-gradient(135deg,#E63946,#C1121F)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 0 40px rgba(230,57,70,0.45)",
          marginBottom:28,
        }}
      >
        <Gem size={32} color="#fff" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        style={{ fontSize:"1.875rem", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}
      >Study Streak</motion.h1>

      <motion.p
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }}
        style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.35)", marginBottom:36, letterSpacing:"0.08em", textTransform:"uppercase" }}
      >EdTech Platform</motion.p>

      {/* Rotating quote */}
      <AnimatePresence mode="wait">
        <motion.p
          key={quoteIdx}
          initial={{ opacity:0, y:8 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.4 }}
          style={{
            maxWidth:320, textAlign:"center",
            fontSize:"0.9375rem", fontStyle:"italic",
            color:"rgba(255,255,255,0.5)", lineHeight:1.6,
            marginBottom:40, padding:"0 20px",
          }}
        >
          &ldquo;{QUOTES[quoteIdx]}&rdquo;
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{
        width:240, height:4, borderRadius:99,
        background:"rgba(255,255,255,0.08)", overflow:"hidden",
        marginBottom:10,
      }}>
        <motion.div
          style={{
            height:"100%", borderRadius:99,
            background:"linear-gradient(90deg,var(--ruby),var(--gold))",
            width:`${progress}%`,
          }}
          transition={{ duration:0.04 }}
        />
      </div>
      <p style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.25)", letterSpacing:"0.04em" }}>
        {progress}%
      </p>
    </motion.div>
  );
}
