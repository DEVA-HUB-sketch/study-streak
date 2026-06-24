"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS  = ["Knowledge","Success","Learning","Growth","Discipline","Focus","Consistency","Mastery","Wisdom","Excellence"];
const CHARS  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const COLORS = ["var(--gold)","var(--ruby)","rgba(255,248,231,0.8)","#4895EF","#52B788"];

interface Particle {
  id: number;
  text: string;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

let nextId = 0;

function makeParticle(): Particle {
  const useWord = Math.random() > 0.55;
  return {
    id:       nextId++,
    text:     useWord ? WORDS[Math.floor(Math.random() * WORDS.length)] : CHARS[Math.floor(Math.random() * CHARS.length)],
    x:        10 + Math.random() * 80,          // % from left
    color:    COLORS[Math.floor(Math.random() * COLORS.length)],
    delay:    Math.random() * 0.5,
    duration: 2.2 + Math.random() * 1.8,
    size:     useWord ? 11 : 14 + Math.random() * 8,
  };
}

interface FloatingKnowledgeProps {
  active: boolean;
  burst?: boolean; // true right after a session is added
}

export default function FloatingKnowledge({ active, burst = false }: FloatingKnowledgeProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    // on burst, emit a quick cluster
    if (burst) {
      const batch = Array.from({ length: 8 }, makeParticle);
      setParticles((p) => [...p, ...batch]);
      return;
    }

    // steady trickle while active
    const id = setInterval(() => {
      setParticles((p) => [...p.slice(-30), makeParticle()]);
    }, 600);
    return () => clearInterval(id);
  }, [active, burst]);

  // prune old particles
  function remove(id: number) {
    setParticles((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: "100%", x: `${p.x}%`, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: "10%", scale: [0.6, 1, 0.9, 0.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
            onAnimationComplete={() => remove(p.id)}
            className="absolute bottom-0 font-bold select-none"
            style={{ color: p.color, fontSize: p.size, left: `${p.x}%`, textShadow: `0 0 8px ${p.color}` }}
          >
            {p.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
