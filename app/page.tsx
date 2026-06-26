"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Gem, Brain, BarChart2, Bot, Check, ChevronDown,
  Star, GitBranch, ArrowRight, Target, BookOpen, Calendar,
  TrendingUp, GraduationCap, Activity, Zap, Trophy,
  Flame, Clock, Users, Menu, X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Bot,           title: "AI Study Coach",       desc: "Generates personalised study plans from your real MongoDB session history, exam scores, and streak data." },
  { icon: Brain,         title: "AI Academic Agent",    desc: "Proactive agent that auto-rebalances your timetable, detects burnout, and surfaces today's mission." },
  { icon: Calendar,      title: "Smart Timetable",      desc: "AI-generated daily schedule calibrated to your exam date, weakest subjects, and available hours." },
  { icon: BarChart2,     title: "Study Analytics",      desc: "30-day charts, subject distribution, week-over-week trends, and a 0–100 consistency score." },
  { icon: GraduationCap, title: "Exam Performance",     desc: "Log marks, auto-compute grades, and see scatter plots correlating study hours with exam scores." },
  { icon: Activity,      title: "Progress Heatmap",     desc: "GitHub-style 365-day contribution graph. Every cell a day, every shade a study hour." },
  { icon: TrendingUp,    title: "AI Mentor",            desc: "Ask 'Why are my marks dropping?' and receive a data-driven answer from your real records." },
  { icon: Target,        title: "Goal Tracking",        desc: "Set a target CGPA or exam goal. The AI agent tracks milestones and adjusts your plan." },
];

const FLOW = [
  { num: "01", icon: BookOpen,    label: "Log Sessions",      desc: "Track subject, duration, date and notes in seconds." },
  { num: "02", icon: Brain,       label: "AI Analyses",       desc: "Agent reads your real data — streak, scores, patterns." },
  { num: "03", icon: Calendar,    label: "Plan Rebalanced",   desc: "Timetable auto-adjusts based on weak subjects and exam proximity." },
  { num: "04", icon: BarChart2,   label: "Score Predicted",   desc: "AI forecasts your next exam score with confidence rating." },
  { num: "05", icon: Trophy,      label: "You Improve",       desc: "Streak grows, badges unlock, rank climbs." },
];

const STATS = [
  { value: 8450,  suffix: "+", label: "Study Sessions",   icon: BookOpen },
  { value: 340,   suffix: "+", label: "Study Hours",      icon: Clock    },
  { value: 2400,  suffix: "+", label: "AI Insights",      icon: Brain    },
  { value: 1200,  suffix: "+", label: "Users Active",     icon: Users    },
  { value: 14,    suffix: "",  label: "AI Features",      icon: Zap      },
];

const TESTIMONIALS = [
  { name: "Priya R.",   college: "B.Tech CSE · IIT Madras",    stars: 5, text: "The AI agent actually rebalanced my timetable after my COA mid-sem. It detected I was spending only 8% of time on it but had 62% marks. That single insight changed my semester." },
  { name: "Arjun K.",   college: "M.Tech · NIT Trichy",         stars: 5, text: "GATE prep was chaotic until Study Streak. The heatmap showed me I was consistent Mon–Thu but dropping weekends. Fixed that habit in one week. Consistency score went 42 → 81." },
  { name: "Sneha M.",   college: "B.Tech ECE · BITS Pilani",    stars: 5, text: "The AI mentor answered 'Why are my marks dropping?' with a data-driven breakdown — not generic advice. It cited my actual session hours vs exam averages. Genuinely mind-blowing." },
];

const FAQ = [
  { q: "What is Study Streak?",          a: "A gamified AI study platform. Log sessions, build streaks, earn ruby rewards, and compete on leaderboards — while the AI agent coaches you in the background." },
  { q: "Is it really free?",             a: "Yes. Unlimited session logging, streak tracking, leaderboards, and achievements are free forever. Advanced AI agent features are available during our beta at no cost." },
  { q: "How does the ruby system work?", a: "Every session earns 1 Ruby. A 7-day streak adds +10, a 30-day streak adds +50, and crossing 100 hours adds +100 bonus rubies." },
  { q: "Does the AI use my real data?",  a: "Yes. Every AI response is generated from your actual MongoDB session data — real hours, real subject distribution, real exam marks. Never generic advice." },
  { q: "Can I use Google Sign-In?",      a: "Yes. We support Google OAuth alongside email/password. Google login only allows existing registered accounts; signup creates a new account securely." },
];

/* ═══════════════════════════════════════════════════════════════
   REUSABLE ATOMS
═══════════════════════════════════════════════════════════════ */

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let c = 0;
    const step = Math.max(1, Math.ceil(to / 80));
    const id   = setInterval(() => { c = Math.min(c + step, to); setV(c); if (c >= to) clearInterval(id); }, 14);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

function Reveal({ children, delay = 0, y = 24, style, className = "" }: {
  children: React.ReactNode; delay?: number; y?: number;
  style?: React.CSSProperties; className?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} style={style} className={className}>
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "#E63946",
      background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.16)",
      borderRadius: 99, padding: "5px 14px", marginBottom: 16,
    }}>{children}</span>
  );
}

/* Floating badge used in the hero illustration area */
function FloatBadge({ icon, text, delay, style: s }: {
  icon: React.ReactNode; text: string; delay: number; style: React.CSSProperties;
}) {
  return (
    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ position: "absolute", pointerEvents: "none", ...s }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "8px 14px",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <span style={{ color: "#E63946" }}>{icon}</span>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap" }}>{text}</span>
      </div>
    </motion.div>
  );
}

/* AI Brain visual — pure CSS/SVG orbital rings + center gem */
function AIBrainVisual() {
  return (
    <div style={{ width: 420, height: 420, position: "relative", flexShrink: 0 }}>
      {/* Background ruby glow */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(230,57,70,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Outer orbit */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 14, border: "1.5px dashed rgba(230,57,70,0.18)", borderRadius: "50%" }}>
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} style={{
            position: "absolute", width: 9, height: 9, borderRadius: "50%",
            background: "linear-gradient(135deg,#E63946,#C1121F)",
            boxShadow: "0 0 8px rgba(230,57,70,0.5)",
            top:  `${50 - 49.5 * Math.cos(deg * Math.PI / 180)}%`,
            left: `${50 + 49.5 * Math.sin(deg * Math.PI / 180)}%`,
            transform: "translate(-50%,-50%)",
          }} />
        ))}
      </motion.div>

      {/* Mid orbit */}
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 72, border: "1px solid rgba(212,163,115,0.22)", borderRadius: "50%" }}>
        {[60, 180, 300].map(deg => (
          <div key={deg} style={{
            position: "absolute", width: 7, height: 7, borderRadius: "50%",
            background: "#D4A373", boxShadow: "0 0 6px rgba(212,163,115,0.6)",
            top:  `${50 - 49.5 * Math.cos(deg * Math.PI / 180)}%`,
            left: `${50 + 49.5 * Math.sin(deg * Math.PI / 180)}%`,
            transform: "translate(-50%,-50%)",
          }} />
        ))}
      </motion.div>

      {/* Inner deco ring */}
      <div style={{ position: "absolute", inset: 130, border: "1px solid rgba(0,0,0,0.06)", borderRadius: "50%" }} />

      {/* Center gem pulsing */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          animate={{ scale: [1, 1.06, 1], boxShadow: ["0 0 0 0 rgba(230,57,70,0)", "0 0 0 18px rgba(230,57,70,0.09)", "0 0 0 0 rgba(230,57,70,0)"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 108, height: 108, borderRadius: "50%",
            background: "linear-gradient(135deg,#E63946,#C1121F)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 14px 44px rgba(230,57,70,0.35), 0 4px 16px rgba(230,57,70,0.2)",
          }}>
          <Gem size={44} color="#fff" />
        </motion.div>
      </div>
    </div>
  );
}

/* Feature card with tilt + icon animation */
function FeatureCard({ icon: Icon, title, desc, i }: {
  icon: React.ComponentType<{ size: number; color: string }>; title: string; desc: string; i: number;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Reveal delay={i * 0.055}>
      <motion.div ref={ref}
        onMouseMove={e => {
          if (!ref.current) return;
          const r = ref.current.getBoundingClientRect();
          setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * 4, y: -((e.clientX - r.left) / r.width - 0.5) * 4 });
        }}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(0,0,0,0.09)" }}
        style={{
          background: "#fff", borderRadius: 20, padding: "26px 24px",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          height: "100%", cursor: "default",
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.18s ease",
        }}>
        <motion.div whileHover={{ scale: 1.12, rotate: 6 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}
          style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(230,57,70,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={20} color="#E63946" />
        </motion.div>
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#111", marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</h3>
        <p style={{ fontSize: "0.9rem", color: "#6B6B6B", lineHeight: 1.65 }}>{desc}</p>
      </motion.div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq,    setOpenFaq]    = useState<number | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F4EC", color: "#1A1A1A", overflowX: "hidden" }}>

      {/* ══════════════════════════
          STICKY NAVBAR
      ══════════════════════════ */}
      <motion.nav
        animate={{
          boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.09)" : "0 1px 0 rgba(0,0,0,0.06)",
        }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "#F8F4EC", transition: "box-shadow 0.3s ease" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#E63946,#C1121F)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(230,57,70,0.32)" }}>
              <Gem size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "#1A1A1A", letterSpacing: "-0.01em" }}>Study Streak</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {[["Home","#"],["Features","#features"],["AI Study Coach","/ai"],["Dashboard","/dashboard"]].map(([label, href]) => (
              <a key={label} href={href}
                style={{ padding: "7px 13px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 500, color: "#4A4A4A", textDecoration: "none", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#E63946"; (e.currentTarget as HTMLElement).style.background = "rgba(230,57,70,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#4A4A4A"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
            <Link href="/login">
              <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ display: "inline-block", padding: "8px 18px", borderRadius: 10, fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A", textDecoration: "none", border: "1.5px solid rgba(0,0,0,0.14)", background: "#fff" }}>
                Log In
              </motion.span>
            </Link>
            <Link href="/signup">
              <motion.span whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(230,57,70,0.35)" }} whileTap={{ scale: 0.97 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, fontSize: "0.9rem", fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#E63946,#C1121F)", boxShadow: "0 4px 14px rgba(230,57,70,0.28)" }}>
                Get Started <ArrowRight size={14} />
              </motion.span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileMenu(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#1A1A1A", padding: 4 }}>
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ background: "#F8F4EC", borderTop: "1px solid rgba(0,0,0,0.07)", padding: "16px 24px 20px" }}>
              {[["Home","#"],["Features","#features"],["AI Study Coach","/ai"],["Dashboard","/dashboard"]].map(([label, href], i) => (
                <a key={label} href={href} onClick={() => setMobileMenu(false)}
                  style={{ display: "block", padding: "12px 0", fontSize: "1rem", fontWeight: 500, color: "#1A1A1A", textDecoration: "none", borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                  {label}
                </a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Link href="/login" style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 10, fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A", border: "1.5px solid rgba(0,0,0,0.14)", textDecoration: "none" }}>Log In</Link>
                <Link href="/signup" style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 10, fontSize: "0.9rem", fontWeight: 700, color: "#fff", background: "#E63946", textDecoration: "none" }}>Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════════════════════
          HERO
      ══════════════════════════ */}
      <section style={{ minHeight: "100vh", paddingTop: 66, display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#F8F4EC 0%,#fff 60%,#F8F4EC 100%)" }}>
        {/* Decorative dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.06) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", opacity: 0.6 }} />
        {/* Ruby accent blobs */}
        <div style={{ position: "absolute", top: "20%", right: "8%",  width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(230,57,70,0.06),transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "5%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,163,115,0.08),transparent 65%)", filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "80px 24px 100px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", width: "100%", position: "relative", zIndex: 1 }} className="hero-grid">

          {/* LEFT: copy */}
          <div style={{ maxWidth: 560 }}>

            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: "clamp(2.75rem,5.5vw,4.5rem)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.045em", color: "#111", marginBottom: 24 }}>
              Study Smarter.{" "}<br className="hidden sm:block" />
              Stay Consistent.{" "}<br className="hidden sm:block" />
              <span style={{ color: "#E63946" }}>Achieve More.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}
              style={{ fontSize: "1.125rem", color: "#5A5A5A", lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
              An AI agent that reads your real study data, auto-rebalances your timetable, detects burnout early, and predicts your next exam score.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/signup">
                <motion.span whileHover={{ scale: 1.04, boxShadow: "0 14px 36px rgba(230,57,70,0.40)" }} whileTap={{ scale: 0.96 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 13, fontSize: "1rem", fontWeight: 800, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#E63946,#C1121F)", boxShadow: "0 6px 20px rgba(230,57,70,0.30)" }}>
                  Get Started Free <ArrowRight size={16} />
                </motion.span>
              </Link>
              <a href="#features">
                <motion.span whileHover={{ scale: 1.02, background: "#F0EBE0" }} whileTap={{ scale: 0.97 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 13, fontSize: "1rem", fontWeight: 600, color: "#333", background: "rgba(0,0,0,0.05)", border: "1.5px solid rgba(0,0,0,0.10)", textDecoration: "none" }}>
                  Explore Features
                </motion.span>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {["🎓","📚","⚡","🏆"].map((e, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "2px solid #F8F4EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", marginLeft: i ? -8 : 0, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>{e}</div>
                ))}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#888" }}>
                <strong style={{ color: "#333" }}>Trusted by students</strong> across IITs, NITs & top colleges
              </p>
            </motion.div>
          </div>

          {/* RIGHT: AI brain + floating badges */}
          <motion.div initial={{ opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }} className="hidden lg:flex">

            {/* Floating glass badges */}
            <FloatBadge icon={<BookOpen size={14}/>}    text="Session logged 📚"       delay={0}   style={{ top: "4%",  left: "-5%" }}  />
            <FloatBadge icon={<Gem size={14}/>}          text="+1 Ruby earned 💎"       delay={0.7} style={{ top: "10%", right: "-4%" }} />
            <FloatBadge icon={<Brain size={14}/>}        text="AI Agent · Active"       delay={1.3} style={{ bottom: "22%", left: "-8%" }} />
            <FloatBadge icon={<Trophy size={14}/>}       text="Rank #2 · Leaderboard"  delay={0.4} style={{ bottom: "8%",  right: "-2%" }} />

            <AIBrainVisual />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════
          STATS BAR
      ══════════════════════════ */}
      <section style={{ padding: "64px 24px", background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          {STATS.map(({ value, suffix, label, icon: Icon }, i) => (
            <Reveal key={label} delay={i * 0.07}>
              <motion.div whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                style={{ textAlign: "center", padding: "28px 16px", borderRadius: 18, background: "#F8F4EC", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(230,57,70,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color="#E63946" />
                  </div>
                </div>
                <p style={{ fontSize: "2.25rem", fontWeight: 900, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  <Counter to={value} suffix={suffix} />
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#888", fontWeight: 500 }}>{label}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          FEATURES
      ══════════════════════════ */}
      <section id="features" style={{ padding: "96px 24px", background: "#F8F4EC" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel><Zap size={11}/> Platform Features</SectionLabel>
            <h2 style={{ fontSize: "clamp(1.875rem,4vw,2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111", marginBottom: 14 }}>
              Everything a serious student needs
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "#6B6B6B", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Eight AI-powered features working together to turn scattered study time into measurable academic progress.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          AI WORKFLOW
      ══════════════════════════ */}
      <section id="ai-workflow" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel><Brain size={11}/> How the AI Agent Works</SectionLabel>
            <h2 style={{ fontSize: "clamp(1.875rem,4vw,2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111", marginBottom: 14 }}>
              From sessions to smarter outcomes
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "#6B6B6B", lineHeight: 1.7 }}>
              Every dashboard load, the agent reads all your real data and takes intelligent action automatically.
            </p>
          </Reveal>

          <div style={{ position: "relative" }}>
            {/* Vertical connector line */}
            <div style={{ position: "absolute", left: 22, top: 22, bottom: 22, width: 2, background: "linear-gradient(to bottom,#E63946,rgba(230,57,70,0.1))", borderRadius: 99, zIndex: 0 }} />

            {FLOW.map(({ num, icon: Icon, label, desc }, i) => (
              <Reveal key={num} delay={i * 0.1}>
                <div style={{ display: "flex", gap: 22, marginBottom: i < FLOW.length - 1 ? 28 : 0, position: "relative" }}>
                  {/* Numbered circle */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "2px solid #E63946", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, boxShadow: "0 0 0 4px #F8F4EC" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#E63946" }}>{num}</span>
                  </div>
                  {/* Content card */}
                  <motion.div whileHover={{ x: 4, boxShadow: "0 8px 28px rgba(0,0,0,0.08)" }}
                    style={{ flex: 1, background: "#F8F4EC", borderRadius: 16, padding: "18px 20px", border: "1px solid rgba(0,0,0,0.07)", marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <Icon size={16} color="#E63946" />
                      <p style={{ fontWeight: 700, fontSize: "1rem", color: "#111", letterSpacing: "-0.01em" }}>{label}</p>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "#6B6B6B", lineHeight: 1.6 }}>{desc}</p>
                  </motion.div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          TESTIMONIALS
      ══════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "#F8F4EC" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel><Star size={11}/> Student Stories</SectionLabel>
            <h2 style={{ fontSize: "clamp(1.875rem,4vw,2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111", marginBottom: 12 }}>
              What students are saying
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "#6B6B6B" }}>Real feedback from students who changed how they study.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {TESTIMONIALS.map(({ name, college, stars, text }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.09)" }}
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 20, padding: "28px 26px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: stars }).map((_, j) => <Star key={j} size={14} fill="#E63946" color="#E63946" />)}
                  </div>
                  <p style={{ fontSize: "0.9375rem", color: "#444", lineHeight: 1.72, marginBottom: 20, fontStyle: "italic" }}>&ldquo;{text}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#E63946,#C1121F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>{name[0]}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{name}</p>
                      <p style={{ fontSize: "0.8125rem", color: "#999" }}>{college}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          FAQ
      ══════════════════════════ */}
      <section id="faq" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionLabel>FAQ</SectionLabel>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111" }}>Frequently Asked</h2>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div style={{ background: "#F8F4EC", border: `1px solid ${openFaq === i ? "rgba(230,57,70,0.25)" : "rgba(0,0,0,0.07)"}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 20px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#111" }}>{q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ flexShrink: 0 }}>
                      <ChevronDown size={17} color="#999" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                        <p style={{ padding: "0 20px 18px", fontSize: "0.9375rem", color: "#666", lineHeight: 1.7 }}>{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          CTA
      ══════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "#F8F4EC" }}>
        <Reveal>
          <div style={{ maxWidth: 820, margin: "0 auto", background: "linear-gradient(135deg,#E63946,#C1121F)", borderRadius: 28, padding: "72px 48px", textAlign: "center", boxShadow: "0 32px 80px rgba(230,57,70,0.28)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <motion.div whileHover={{ scale: 1.08, rotate: 6 }} style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Gem size={26} color="#fff" />
              </motion.div>
              <h2 style={{ fontSize: "clamp(2rem,4vw,2.875rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>
                Start your streak today
              </h2>
              <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 440, margin: "0 auto 36px" }}>
                Join students turning study sessions into measurable academic results. Free to start, no credit card required.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/signup">
                  <motion.span whileHover={{ scale: 1.04, boxShadow: "0 12px 30px rgba(0,0,0,0.22)" }} whileTap={{ scale: 0.97 }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 13, fontSize: "1rem", fontWeight: 800, color: "#E63946", background: "#fff", textDecoration: "none" }}>
                    Get Started Free <ArrowRight size={16} />
                  </motion.span>
                </Link>
                <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "14px 24px", borderRadius: 13, fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(255,255,255,0.30)", textDecoration: "none" }}>
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════
          FOOTER
      ══════════════════════════ */}
      <footer style={{ background: "#111", color: "rgba(255,255,255,0.45)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 24px 40px", display: "grid", gridTemplateColumns: "1.6fr repeat(3,1fr)", gap: 40 }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#E63946,#C1121F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gem size={15} color="#fff" />
              </div>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>Study Streak</span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.7, maxWidth: 220, marginBottom: 20 }}>
              An agentic AI platform built to help serious students achieve more through consistency, data, and intelligent guidance.
            </p>
            {/* Social links */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "GitHub",   icon: <GitBranch size={15}/> },
                { label: "LinkedIn", icon: <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>in</span> },
              ].map(({ icon, label }) => (
                <a key={label} href="#" title={label}
                  style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {[
            { heading: "Product",  links: [["Dashboard","/dashboard"],["AI Coach","/ai"],["Leaderboard","/leaderboard"],["Achievements","/achievements"]] },
            { heading: "Features", links: [["Heatmap","/progress"],["Exam Analytics","/exams"],["Test Generator","/challenges"],["AI Resources","/resources"]] },
            { heading: "Contact",  links: [["Sign Up","/signup"],["Log In","/login"],["Profile","/profile"],["Settings","/settings"]] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.8125rem", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.07em" }}>{heading}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([label, href]) => (
                  <Link key={label} href={href}
                    style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.42)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)"; }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: "0.8125rem" }}>© 2026 Study Streak. All rights reserved.</p>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy","Terms","Contact"].map(l => <a key={l} href="#" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>{l}</a>)}
          </div>
        </div>
      </footer>

      {/* Responsive breakpoints */}
      <style>{`
        @media (max-width: 1023px) {
          .hero-grid   { grid-template-columns: 1fr !important; max-width: 600px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
        }
        @media (max-width: 639px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
