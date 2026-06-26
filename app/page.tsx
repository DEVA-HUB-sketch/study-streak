"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion, useInView, AnimatePresence, useScroll, useTransform,
} from "framer-motion";
import {
  Gem, Brain, BarChart2, Bot,
  ChevronDown, Star, ArrowRight, Target, Calendar,
  TrendingUp, Menu, X, GitBranch,
  GraduationCap, Activity,
} from "lucide-react";


/* ════════════════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: <Bot       size={20} />,
    title: "AI Study Coach",
    desc:  "Generates personalised study plans from your real session history, exam scores, and streak data — not just form inputs.",
    tag:   "AI-Powered",
  },
  {
    icon: <Brain     size={20} />,
    title: "AI Academic Agent",
    desc:  "A proactive agent that runs on every dashboard load. Auto-rebalances your timetable, detects burnout, and surfaces daily missions.",
    tag:   "Agentic",
  },
  {
    icon: <Calendar  size={20} />,
    title: "Smart Timetable",
    desc:  "AI-generated daily schedules calibrated to your exam date, daily hours, and weakest subjects. Pinned to your dashboard.",
    tag:   "Auto-generated",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Study Analytics",
    desc:  "30-day activity charts, subject distribution, week-over-week trends, and a consistency score from 0 to 100.",
    tag:   "Insights",
  },
  {
    icon: <GraduationCap size={20} />,
    title: "Exam Performance",
    desc:  "Log marks, auto-compute grades (O/A+/A/B), and see trend charts correlating study hours with exam scores.",
    tag:   "Track Marks",
  },
  {
    icon: <Activity  size={20} />,
    title: "Progress Heatmap",
    desc:  "GitHub-style 365-day study heatmap. See your consistency at a glance — every cell a day, every shade a study hour.",
    tag:   "Visual",
  },
  {
    icon: <TrendingUp size={20} />,
    title: "AI Mentor",
    desc:  "Ask \"Why are my marks dropping?\" and get a data-driven answer backed by your actual session history and exam records.",
    tag:   "Memory",
  },
  {
    icon: <Target    size={20} />,
    title: "Goal Tracking",
    desc:  "Set a target CGPA or exam goal. The AI agent tracks milestones, adjusts your timetable, and celebrates wins.",
    tag:   "Agent",
  },
];

const WORKFLOW = [
  { n:"01", title:"Log Study Sessions",    desc:"Track subject, duration, date and notes. Takes 15 seconds." },
  { n:"02", title:"AI Agent Analyses",      desc:"Groq AI reads ALL your data — sessions, exams, streaks, burnout signals." },
  { n:"03", title:"Timetable Rebalanced",  desc:"Agent auto-adjusts your schedule based on weak subjects and exam proximity." },
  { n:"04", title:"Performance Predicted", desc:"AI forecasts your next exam score with confidence rating and risk level." },
  { n:"05", title:"You Improve",           desc:"Consistency score rises, badges unlock, streak grows. Repeat daily." },
];

const STATS = [
  { value: 8450,  suffix: "+", label: "Study Sessions Logged" },
  { value: 340,   suffix: "+", label: "Study Hours Tracked"   },
  { value: 2400,  suffix: "+", label: "AI Recommendations"    },
  { value: 14,    suffix: "",  label: "AI-Powered Features"   },
  { value: 98,    suffix: "%", label: "Student Satisfaction"  },
];

const TESTIMONIALS = [
  {
    name: "Priya R.", college: "B.Tech CSE · IIT Madras", stars: 5,
    text: "The AI agent actually rebalanced my timetable after my COA mid-sem. It detected I was spending only 8% of study time on it but had 62% marks. That insight alone changed my semester.",
  },
  {
    name: "Arjun K.", college: "M.Tech · NIT Trichy", stars: 5,
    text: "GATE prep was chaotic until Study Streak. The heatmap showed me I was consistent Mon–Thu but dropping on weekends. Fixed that habit in one week. Consistency score went from 42 to 81.",
  },
  {
    name: "Sneha M.", college: "B.Tech ECE · BITS Pilani", stars: 5,
    text: "The AI mentor answered 'Why are my marks dropping?' with a data-driven breakdown — not generic advice. It cited my actual session hours per subject vs exam averages. Mind-blowing.",
  },
];

const FAQ = [
  {
    q: "How is this different from a simple study timer?",
    a: "Study Streak has a full AI agent that reads your session history, exam marks, and consistency patterns before making decisions. It doesn't just track time — it auto-rebalances your timetable, predicts exam scores, and detects burnout.",
  },
  {
    q: "Does the AI use my real data or generic advice?",
    a: "Every AI response is generated from your actual MongoDB session data — real hours, real subject distribution, real exam marks. The AI is explicitly instructed to never give generic advice and must cite your actual numbers.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. Session logging, AI Study Coach, heatmap, leaderboard, achievements, and basic analytics are free. Advanced AI agent features and performance analytics are available free during our beta.",
  },
  {
    q: "How does the timetable auto-rebalancing work?",
    a: "The AI agent compares your exam scores per subject against your study time allocation. When a subject is underperforming relative to time invested, it proposes adjusted slot durations and saves them directly to your pinned plan.",
  },
  {
    q: "Can I use Google Sign-In?",
    a: "Yes. We support Google OAuth alongside email/password. Google login only allows existing registered accounts — Google signup creates a new account securely.",
  },
];


/* ════════════════════════════════════════════════════════════════
   REUSABLE ATOMS
════════════════════════════════════════════════════════════════ */

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(to / 60));
    const id   = setInterval(() => {
      cur = Math.min(cur + step, to);
      setV(cur);
      if (cur >= to) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

/* Fade-in + slide-up on scroll enter */
function Reveal({
  children, delay = 0, y = 20, className = "", style,
}: {
  children: React.ReactNode; delay?: number; y?: number;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* Section label pill */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", color: "var(--ruby)",
      background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.18)",
      borderRadius: 99, padding: "5px 14px", marginBottom: 16,
    }}>{children}</span>
  );
}


/* ════════════════════════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq,    setOpenFaq]    = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroO  = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ background: "#FDFAF4", color: "#1A1A1A", overflowX: "hidden" }}>

      {/* ════════════════════════════
          NAVBAR
      ════════════════════════════ */}
      <motion.nav
        animate={{
          /* Use rgba(0) instead of "transparent" — Framer Motion can't interpolate
             between a keyword and an rgba value, causing the console warning */
          background:   scrolled ? "rgba(253,250,244,0.92)" : "rgba(253,250,244,0)",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(0,0,0,0)",
        }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 24px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#E63946,#C1121F)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(230,57,70,0.35)",
            }}>
              <Gem size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "#1A1A1A", letterSpacing: "-0.01em" }}>
              Study Streak
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {[
              ["#features",  "Features"],
              ["#workflow",  "How it Works"],
              ["#stats",     "Impact"],
              ["#faq",       "FAQ"],
            ].map(([href, label]) => (
              <a key={label} href={href}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  fontSize: "0.9rem", fontWeight: 500, color: "#555",
                  textDecoration: "none", transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = "#1A1A1A";
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = "#555";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
            <Link href="/login" style={{
              padding: "8px 18px", borderRadius: 9,
              fontSize: "0.9rem", fontWeight: 600,
              color: "#1A1A1A", textDecoration: "none",
              border: "1.5px solid rgba(0,0,0,0.12)",
              background: "#fff",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E63946"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.12)"; }}
            >
              Sign In
            </Link>
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(230,57,70,0.35)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 9,
                  fontSize: "0.9rem", fontWeight: 700,
                  color: "#fff", textDecoration: "none",
                  background: "linear-gradient(135deg,#E63946,#C1121F)",
                  boxShadow: "0 4px 14px rgba(230,57,70,0.3)",
                }}
              >
                Get Started <ArrowRight size={14} />
              </motion.span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenu(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            {mobileMenu ? <X size={22} color="#1A1A1A" /> : <Menu size={22} color="#1A1A1A" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                background: "#FDFAF4", borderTop: "1px solid rgba(0,0,0,0.07)",
                padding: "16px 24px 24px",
              }}
            >
              {["#features","#workflow","#stats","#faq"].map((href, i) => (
                <a key={href} href={href}
                  onClick={() => setMobileMenu(false)}
                  style={{
                    display: "block", padding: "12px 0",
                    fontSize: "1rem", fontWeight: 500,
                    color: "#1A1A1A", textDecoration: "none",
                    borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {["Features","How it Works","Impact","FAQ"][i]}
                </a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Link href="/login" style={{
                  flex: 1, textAlign: "center", padding: "10px", borderRadius: 9,
                  fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A",
                  border: "1.5px solid rgba(0,0,0,0.12)", textDecoration: "none",
                }}>
                  Sign In
                </Link>
                <Link href="/signup" style={{
                  flex: 1, textAlign: "center", padding: "10px", borderRadius: 9,
                  fontSize: "0.9rem", fontWeight: 700, color: "#fff",
                  background: "#E63946", textDecoration: "none",
                }}>
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ════════════════════════════
          HERO
      ════════════════════════════ */}
      <section ref={heroRef}
        style={{
          minHeight: "100vh", paddingTop: 64,
          display: "flex", alignItems: "center",
          background: "linear-gradient(160deg,#FDFAF4 0%,#F8F4EC 60%,#F4EDE0 100%)",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(230,57,70,0.055),transparent 65%)",
          pointerEvents: "none",
        }} />

        <motion.div style={{ y: heroY, opacity: heroO, width: "100%" }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto",
            padding: "80px 24px 100px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64, alignItems: "center",
          }}
            className="hero-grid"
          >

            {/* ── Left: copy ─────────────────────────── */}
            <div style={{ maxWidth: 560 }}>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: "clamp(2.5rem,5.5vw,4rem)",
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  color: "#111",
                  marginBottom: 22,
                }}
              >
                Study Smarter.{" "}
                <br className="hidden sm:block" />
                Stay Consistent.{" "}
                <br className="hidden sm:block" />
                <span style={{
                  background: "linear-gradient(135deg,#E63946 20%,#C1121F 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  Achieve More.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{
                  fontSize: "1.125rem", color: "#6B6B6B",
                  lineHeight: 1.7, marginBottom: 36, maxWidth: 460,
                }}
              >
                An AI academic agent that proactively monitors your study sessions, auto-balances your timetable, and predicts your next exam score — using your real data.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="hero-ctas"
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}
              >
                <Link href="/signup">
                  <motion.span
                    whileHover={{ scale: 1.03, boxShadow: "0 12px 32px rgba(230,57,70,0.38)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "13px 26px", borderRadius: 12,
                      fontSize: "1rem", fontWeight: 700, color: "#fff",
                      background: "linear-gradient(135deg,#E63946,#C1121F)",
                      boxShadow: "0 6px 20px rgba(230,57,70,0.3)",
                      textDecoration: "none",
                    }}
                  >
                    Get Started Free <ArrowRight size={16} />
                  </motion.span>
                </Link>
                <a href="#features">
                  <motion.span
                    whileHover={{ scale: 1.02, background: "rgba(0,0,0,0.06)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "13px 24px", borderRadius: 12,
                      fontSize: "1rem", fontWeight: 600, color: "#333",
                      background: "rgba(0,0,0,0.04)",
                      border: "1.5px solid rgba(0,0,0,0.08)",
                      textDecoration: "none",
                    }}
                  >
                    Explore Features
                  </motion.span>
                </a>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="hero-social"
              style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                <div style={{ display: "flex" }}>
                  {["🎓", "📚", "⚡", "🏆"].map((e, i) => (
                    <div key={i} style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "#fff", border: "2px solid #F8F4EC",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.875rem", marginLeft: i ? -8 : 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}>{e}</div>
                  ))}
                </div>
                <p style={{ fontSize: "0.875rem", color: "#888" }}>
                  <strong style={{ color: "#333" }}>Trusted by students</strong> across IITs, NITs & top colleges
                </p>
              </motion.div>
            </div>

            {/* ── Right: AI dashboard mock ──────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", display: "flex", justifyContent: "center" }}
              className="hidden lg:flex"
            >
              {/* Dashboard card */}
              <div style={{
                width: "100%", maxWidth: 400,
                borderRadius: 24,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.06)",
                overflow: "hidden",
                position: "relative", zIndex: 3,
              }}>
                {/* Card header */}
                <div style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg,#1A1A1A,#2A2A2A)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "linear-gradient(135deg,#E63946,#C1121F)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Gem size={13} color="#fff" />
                  </div>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem" }}>AI Study Agent</span>
                  <div style={{
                    marginLeft: "auto", padding: "2px 8px", borderRadius: 99,
                    background: "rgba(82,183,136,0.2)", color: "#52B788",
                    fontSize: "0.6875rem", fontWeight: 700,
                  }}>● Active</div>
                </div>

                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Today's mission */}
                  <div style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: "rgba(230,57,70,0.05)",
                    border: "1px solid rgba(230,57,70,0.12)",
                  }}>
                    <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#E63946",
                      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
                      Today&apos;s Mission
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "#333", lineHeight: 1.55 }}>
                      Focus on <strong>Digital Systems</strong> — your exam is in 4 days and you&apos;re at 62% readiness.
                    </p>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[
                      { label: "Sessions", value: "47", icon: "📚" },
                      { label: "Streak",   value: "12d", icon: "🔥" },
                      { label: "Rubies",   value: "58", icon: "💎" },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: "#F8F4EC", borderRadius: 10,
                        padding: "10px 8px", textAlign: "center",
                      }}>
                        <p style={{ fontSize: "1rem", marginBottom: 3 }}>{s.icon}</p>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#1A1A1A" }}>{s.value}</p>
                        <p style={{ fontSize: "0.625rem", color: "#888" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>Daily Goal</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E63946" }}>72%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "#F0EBE0", overflow: "hidden" }}>
                      <motion.div
                        style={{ height: "100%", borderRadius: 99,
                          background: "linear-gradient(90deg,#E63946,#D4A373)" }}
                        initial={{ width: "0%" }}
                        animate={{ width: "72%" }}
                        transition={{ delay: 0.7, duration: 1.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Recent sessions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      ["Digital Systems", "90 min"],
                      ["Engineering Maths", "60 min"],
                      ["Computer Networks", "45 min"],
                    ].map(([sub, dur], i) => (
                      <motion.div key={sub}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 10px", borderRadius: 9,
                          background: "#F8F4EC",
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E63946", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: "0.8125rem", color: "#444" }}>{sub}</span>
                        <span style={{ fontSize: "0.75rem", color: "#888" }}>{dur}</span>
                      </motion.div>
                    ))}
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom edge fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(to bottom,transparent,#FDFAF4)",
          pointerEvents: "none",
        }} />
      </section>

      {/* ════════════════════════════
          STATS
      ════════════════════════════ */}
      <section id="stats" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <Label><BarChart2 size={11} /> Real Impact</Label>
            <h2 style={{
              fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#111",
            }}>
              Measured in real outcomes
            </h2>
          </Reveal>

          <div className="landing-stats-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 16,
          }}>
            {STATS.map(({ value, suffix, label }, i) => (
              <Reveal key={label} delay={i * 0.07}>
                <div style={{
                  textAlign: "center", padding: "28px 16px",
                  borderRadius: 16, background: "#FDFAF4",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}>
                  <p style={{
                    fontSize: "2.5rem", fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: i === 0 ? "#E63946" : "#1A1A1A",
                    marginBottom: 6,
                  }}>
                    <Counter to={value} suffix={suffix} />
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#888", fontWeight: 500 }}>{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          FEATURES
      ════════════════════════════ */}
      <section id="features" style={{ padding: "96px 24px", background: "#FDFAF4" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <Label><Bot size={11} /> Platform Features</Label>
            <h2 style={{
              fontSize: "clamp(1.875rem,4vw,2.75rem)", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#111", marginBottom: 14,
            }}>
              Built for serious students
            </h2>
            <p style={{
              fontSize: "1.0625rem", color: "#777",
              maxWidth: 520, margin: "0 auto", lineHeight: 1.7,
            }}>
              Eight AI-powered features that work together to transform scattered study time into measurable academic progress.
            </p>
          </Reveal>

          <div style={{
            display: "grid",
            /* landing-features-grid → 1 col on mobile via CSS */
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 16,
          }}>
            {FEATURES.map(({ icon, title, desc, tag }, i) => (
              <Reveal key={title} delay={i * 0.055}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.09)" }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.07)",
                    borderRadius: 18, padding: "26px 24px",
                    height: "100%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(230,57,70,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#E63946", marginBottom: 16,
                  }}>
                    {icon}
                  </div>
                  {/* Tag */}
                  <span style={{
                    fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: "#E63946",
                    marginBottom: 8, display: "block",
                  }}>{tag}</span>
                  <h3 style={{
                    fontSize: "1.0625rem", fontWeight: 700,
                    color: "#111", marginBottom: 8, letterSpacing: "-0.01em",
                  }}>{title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "#777", lineHeight: 1.65 }}>{desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          AI WORKFLOW
      ════════════════════════════ */}
      <section id="workflow" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
            <Label><Bot size={11} /> How the AI Agent Works</Label>
            <h2 style={{
              fontSize: "clamp(1.875rem,4vw,2.75rem)", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#111", marginBottom: 14,
            }}>
              From sessions to smarter outcomes
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "#777", lineHeight: 1.7 }}>
              Every dashboard load, the agent runs autonomously — reading all your data and taking action without waiting for you to ask.
            </p>
          </Reveal>

          {/* Vertical timeline */}
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute", left: 22, top: 0, bottom: 0, width: 2,
              background: "linear-gradient(to bottom,#E63946,rgba(230,57,70,0.1))",
            }} />

            {WORKFLOW.map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 0.1}>
                <div style={{
                  display: "flex", gap: 24,
                  marginBottom: i < WORKFLOW.length - 1 ? 36 : 0,
                  position: "relative",
                }}>
                  {/* Step circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: "#fff", border: "2px solid #E63946",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 800, color: "#E63946",
                    boxShadow: "0 0 0 4px #FDFAF4",
                    zIndex: 1,
                  }}>
                    {n}
                  </div>
                  {/* Content */}
                  <div style={{
                    background: "#FDFAF4", borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "18px 20px", flex: 1,
                    marginTop: 4,
                  }}>
                    <h3 style={{
                      fontSize: "1.0625rem", fontWeight: 700,
                      color: "#111", marginBottom: 6, letterSpacing: "-0.01em",
                    }}>{title}</h3>
                    <p style={{ fontSize: "0.9rem", color: "#777", lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          TESTIMONIALS
      ════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "#FDFAF4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <Label><Star size={11} /> Student Stories</Label>
            <h2 style={{
              fontSize: "clamp(1.875rem,4vw,2.75rem)", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#111", marginBottom: 12,
            }}>
              What students are saying
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "#777" }}>
              Real feedback from students who changed how they study.
            </p>
          </Reveal>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 20,
          }}>
            {TESTIMONIALS.map(({ name, college, stars, text }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.07)",
                    borderRadius: 18, padding: "28px 26px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: stars }).map((_, j) => (
                      <Star key={j} size={14} fill="#E63946" color="#E63946" />
                    ))}
                  </div>
                  <p style={{
                    fontSize: "0.9375rem", color: "#444", lineHeight: 1.7,
                    marginBottom: 20, fontStyle: "italic",
                  }}>
                    &ldquo;{text}&rdquo;
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "linear-gradient(135deg,#E63946,#C1121F)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "0.9375rem", flexShrink: 0,
                    }}>
                      {name[0]}
                    </div>
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

      {/* ════════════════════════════
          FAQ
      ════════════════════════════ */}
      <section id="faq" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <Label>FAQ</Label>
            <h2 style={{
              fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#111",
            }}>
              Frequently asked questions
            </h2>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div
                  style={{
                    background: "#FDFAF4",
                    border: `1px solid ${openFaq === i ? "rgba(230,57,70,0.25)" : "rgba(0,0,0,0.07)"}`,
                    borderRadius: 14, overflow: "hidden",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 12,
                    padding: "18px 20px",
                  }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#111" }}>{q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flexShrink: 0 }}
                    >
                      <ChevronDown size={17} color="#999" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{
                          padding: "0 20px 18px",
                          fontSize: "0.9375rem", color: "#666", lineHeight: 1.7,
                        }}>
                          {a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          CTA BANNER
      ════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "#FDFAF4" }}>
        <Reveal>
          <div style={{
            maxWidth: 800, margin: "0 auto",
            background: "linear-gradient(135deg,#E63946 0%,#C1121F 100%)",
            borderRadius: 28, padding: "72px 48px",
            textAlign: "center",
            boxShadow: "0 32px 80px rgba(230,57,70,0.30)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Subtle pattern */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.06,
              background: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
              backgroundSize: "24px 24px",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <Gem size={26} color="#fff" />
              </div>

              <h2 style={{
                fontSize: "clamp(2rem,4vw,2.875rem)",
                fontWeight: 900, color: "#fff",
                letterSpacing: "-0.03em", marginBottom: 16,
              }}>
                Start your study streak today
              </h2>
              <p style={{
                fontSize: "1.0625rem", color: "rgba(255,255,255,0.75)",
                lineHeight: 1.65, marginBottom: 36, maxWidth: 440, margin: "0 auto 36px",
              }}>
                Join students turning study sessions into measurable academic results. Free to start, no credit card required.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/signup">
                  <motion.span
                    whileHover={{ scale: 1.04, boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "14px 28px", borderRadius: 12,
                      fontSize: "1rem", fontWeight: 800,
                      color: "#E63946", background: "#fff",
                      textDecoration: "none",
                    }}
                  >
                    Get Started Free <ArrowRight size={16} />
                  </motion.span>
                </Link>
                <a href="#features">
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "14px 24px", borderRadius: 12,
                    fontSize: "1rem", fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    textDecoration: "none",
                  }}>
                    Learn More
                  </span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════════
          FOOTER
      ════════════════════════════ */}
      <footer style={{ background: "#111", color: "rgba(255,255,255,0.45)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "64px 24px 40px",
          display: "grid",
          gridTemplateColumns: "1.5fr repeat(3,1fr)",
          gap: 40,
        }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg,#E63946,#C1121F)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Gem size={15} color="#fff" />
              </div>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>Study Streak</span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.7, maxWidth: 220, marginBottom: 20 }}>
              An agentic AI platform built to help serious students achieve more — through consistency, data, and intelligent guidance.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { icon: <GitBranch size={15} />, label: "GitHub"   },
                { icon: <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>in</span>, label: "LinkedIn" },
              ].map(({ icon, label }) => (
                <a key={label} href="#"
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.5)", textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                  }}
                  title={label}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              heading: "Product",
              links: [
                ["Dashboard",   "/dashboard"],
                ["AI Coach",    "/ai"],
                ["Leaderboard", "/leaderboard"],
                ["Achievements","/achievements"],
              ],
            },
            {
              heading: "Features",
              links: [
                ["Study Heatmap",    "/progress"],
                ["Exam Analytics",   "/exams"],
                ["Test Generator",   "/challenges"],
                ["AI Resources",     "/resources"],
              ],
            },
            {
              heading: "Account",
              links: [
                ["Sign Up",    "/signup"],
                ["Login",      "/login"],
                ["Profile",    "/profile"],
                ["Settings",   "/settings"],
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 style={{
                color: "rgba(255,255,255,0.65)", fontWeight: 600,
                fontSize: "0.8125rem", marginBottom: 16,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{heading}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([label, href]) => (
                  <Link key={label} href={href}
                    style={{
                      fontSize: "0.875rem", color: "rgba(255,255,255,0.42)",
                      textDecoration: "none", transition: "color 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)"; }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "20px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <p style={{ fontSize: "0.8125rem" }}>© 2026 Study Streak. All rights reserved.</p>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#"
                style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Responsive helpers ──────────────────────────────────── */}
      <style>{`
        @media (max-width: 1024px) {
          .hero-grid  { grid-template-columns: 1fr !important; max-width: 600px; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

    </div>
  );
}
