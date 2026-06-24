"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface KnowledgeBrainProps {
  progress: number; // 0-100
  size?: number;
}

/* ── Neural node positions (normalised 0→1 in a unit square) ── */
const NODES = [
  [0.50,0.18],[0.64,0.23],[0.75,0.36],[0.72,0.51],
  [0.60,0.63],[0.50,0.70],[0.40,0.63],[0.28,0.51],
  [0.25,0.36],[0.36,0.23],[0.50,0.32],[0.42,0.46],
  [0.58,0.46],[0.50,0.54],[0.34,0.38],[0.66,0.38],
];
const EDGES = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0],
  [0,10],[10,11],[10,12],[11,13],[12,13],[9,14],[2,15],
  [11,6],[12,3],[14,7],[15,2],[10,14],[10,15],
];

/* ── Glow config per fill stage ──────────────────────────────── */
function stageConfig(pct: number) {
  if (pct < 25)  return { fill1:"rgba(148,163,184,0.4)",  fill2:"rgba(100,116,139,0.3)", glow:"rgba(148,163,184,0.2)",  label:"Cold glass — start studying!" };
  if (pct < 50)  return { fill1:"rgba(212,163,115,0.55)", fill2:"rgba(180,120,60,0.45)", glow:"rgba(212,163,115,0.35)", label:"Warm glow — knowledge building!" };
  if (pct < 75)  return { fill1:"rgba(212,163,115,0.75)", fill2:"rgba(230,160,70,0.60)", glow:"rgba(212,163,115,0.55)", label:"Bright gold — brain is alive!" };
  if (pct < 100) return { fill1:"rgba(230,57,70,0.70)",   fill2:"rgba(193,18,31,0.60)",  glow:"rgba(230,57,70,0.65)",  label:"Ruby energy — almost there!" };
  return               { fill1:"rgba(230,57,70,0.85)",   fill2:"rgba(255,100,60,0.75)", glow:"rgba(230,57,70,0.90)",  label:"🧠 Knowledge Unlocked!" };
}

export default function KnowledgeBrain({ progress, size = 220 }: KnowledgeBrainProps) {
  const sp     = useSpring(0, { stiffness: 55, damping: 18 });
  const fillY  = useTransform(sp, v => size * (1 - v / 100));   // svg y of liquid top
  const [disp, setDisp] = useState(0);
  const wavePath1 = useRef<SVGPathElement>(null);
  const wavePath2 = useRef<SVGPathElement>(null);

  useEffect(() => {
    sp.set(progress);
    let cur = 0; const tgt = progress;
    const step = Math.max(1, Math.ceil(tgt / 50));
    const id   = setInterval(() => {
      cur = Math.min(cur + step, tgt);
      setDisp(cur);
      if (cur >= tgt) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [progress, sp]);

  const cfg   = stageConfig(progress);
  const half  = size / 2;
  const r     = half - 8;
  const nodes = NODES.map(([x, y]) => [x * size, y * size]);

  /* Wave points: two offset sinusoids for liquid surface */
  function waveDef(yBase: number, phase: number, amp: number) {
    const pts: string[] = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * size;
      const y = yBase + Math.sin((i / steps) * Math.PI * 2 + phase) * amp;
      pts.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
    }
    pts.push(`L${size},${size} L0,${size} Z`);
    return pts.join(" ");
  }

  const waveAmp = progress >= 98 ? 1 : 5;

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ position:"relative", width:size, height:size }}>
        {/* Outer glow ring */}
        <motion.div
          animate={{ opacity: [0.6,1,0.6] }}
          transition={{ duration: 2.5, repeat:Infinity }}
          style={{
            position:"absolute", inset:-8, borderRadius:"50%",
            background:`radial-gradient(circle, ${cfg.glow}, transparent 70%)`,
            filter:"blur(12px)",
          }}
        />

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="hidden">
          <defs>
            <clipPath id={`brain-${size}`}>
              <circle cx={half} cy={half} r={r} />
            </clipPath>
            <clipPath id={`liquid-${size}`}>
              <motion.rect x={0} style={{ y: fillY }} width={size} height={size} />
            </clipPath>
            <linearGradient id={`lgrad-${size}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cfg.fill1} />
              <stop offset="100%" stopColor={cfg.fill2} />
            </linearGradient>
          </defs>

          {/* Brain background */}
          <circle cx={half} cy={half} r={r}
            fill="rgba(29,29,29,0.55)"
            stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

          {/* Neural edges — dim */}
          <g clipPath={`url(#brain-${size})`}>
            {EDGES.map(([a,b],i) => (
              <line key={i}
                x1={nodes[a][0]} y1={nodes[a][1]}
                x2={nodes[b][0]} y2={nodes[b][1]}
                stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
            ))}
          </g>

          {/* Liquid fill */}
          <g clipPath={`url(#brain-${size})`}>
            {/* Static fill below wave */}
            <motion.rect
              x={0} width={size} height={size}
              fill={`url(#lgrad-${size})`}
              style={{ y: fillY }}
            />

            {/* Animated wave surface */}
            <g clipPath={`url(#brain-${size})`}>
              <motion.g
                animate={{ x: [0,-size,0] }}
                transition={{ duration:3, repeat:Infinity, ease:"linear" }}
              >
                {/* Wave 1 */}
                <motion.path
                  style={{ y: fillY }}
                  d={waveDef(0, 0, waveAmp)}
                  fill={cfg.fill1}
                  opacity={0.7}
                />
                {/* Wave 2 (offset) */}
                <motion.path
                  style={{ y: fillY }}
                  d={waveDef(-waveAmp, Math.PI, waveAmp * 0.7)}
                  fill={cfg.fill2}
                  opacity={0.5}
                />
              </motion.g>
            </g>

            {/* Neural edges — lit (only in filled zone) */}
            <g clipPath={`url(#liquid-${size})`} style={{ clipPath:`url(#brain-${size})` }}>
              {EDGES.map(([a,b],i) => (
                <line key={`lit-${i}`}
                  x1={nodes[a][0]} y1={nodes[a][1]}
                  x2={nodes[b][0]} y2={nodes[b][1]}
                  stroke={progress>74?"rgba(255,180,180,0.8)":"rgba(255,220,150,0.75)"}
                  strokeWidth="1.2" />
              ))}
            </g>
          </g>

          {/* Neural nodes */}
          {nodes.map(([nx,ny],i) => {
            const nodePct = ((size - ny) / size) * 100;
            const lit = progress >= nodePct;
            return (
              <motion.circle key={i}
                cx={nx} cy={ny} r={lit?4:2.5}
                fill={lit ? (progress>74?"#E63946":"#D4A373") : "rgba(255,255,255,0.18)"}
                stroke={lit?"rgba(255,255,255,0.5)":"none"} strokeWidth="0.8"
                animate={lit ? { scale:[1,1.35,1] } : {}}
                transition={{ duration:1.8, repeat:Infinity, delay:i*0.1 }}
              />
            );
          })}

          {/* Brain ring */}
          <circle cx={half} cy={half} r={r}
            fill="none"
            stroke={progress>74?"rgba(230,57,70,0.4)":progress>24?"rgba(212,163,115,0.35)":"rgba(255,255,255,0.1)"}
            strokeWidth="1.5" />
        </svg>

        {/* Percentage overlay */}
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <motion.span
            key={disp}
            initial={{ scale:0.85, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            style={{ fontSize: size < 160 ? "1.6rem" : "2rem", fontWeight:800, lineHeight:1,
              color: progress>74?"#E63946":progress>24?"#D4A373":"rgba(255,255,255,0.7)",
              textShadow:`0 0 20px ${cfg.glow}` }}
          >
            {disp}%
          </motion.span>
          <span style={{ fontSize:"0.625rem", fontWeight:500, color:"rgba(255,255,255,0.4)", marginTop:2, letterSpacing:"0.06em", textTransform:"uppercase" }}>
            Daily Goal
          </span>
        </div>
      </div>

      {/* Stage label */}
      <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.45)", textAlign:"center", maxWidth: size, lineHeight:1.4 }}>
        {cfg.label}
      </p>
    </div>
  );
}
