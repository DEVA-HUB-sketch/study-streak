"use client";

/**
 * DailyMotivation — shown once per calendar day on the dashboard.
 * Stored in localStorage so it doesn't show again until tomorrow.
 * No new API — reads from /api/auth/me and /api/analytics.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Target, Lightbulb, Zap } from "lucide-react";

const QUOTES = [
  "Success is the sum of small efforts repeated daily.",
  "The expert in anything was once a beginner.",
  "Consistency beats intensity every single time.",
  "Knowledge is the one thing no one can take from you.",
  "Your future self is watching you right now. Make them proud.",
  "Every session you complete is a brick in your success.",
  "Champions are built in the quiet moments of study.",
  "One more session is one step closer to mastery.",
  "The journey of a thousand miles begins with a single session.",
  "Stay consistent. Great things take time.",
  "Push yourself — no one else is going to do it for you.",
  "Education is not the filling of a pail but the lighting of a fire.",
  "Small daily improvements are the key to staggering long-term results.",
  "Discipline is choosing between what you want now and what you want most.",
  "The more you learn, the more you earn.",
];

const STUDY_TIPS = [
  "Study the hardest subject first — your brain is freshest at the start.",
  "Take a 5-min break every 25 minutes to prevent mental fatigue (Pomodoro).",
  "Explain a concept out loud as if teaching someone — it reveals gaps instantly.",
  "Spaced repetition beats cramming for long-term retention every time.",
  "Write notes by hand — motor memory reinforces what you read.",
  "Start sessions with a quick review of yesterday's material.",
  "Set a specific goal for each session, not just 'study for 2 hours'.",
  "Study in the same place daily — your brain learns to focus on cue.",
  "Drink water before and during study sessions — dehydration kills focus.",
  "End each session by writing 3 things you learned today.",
];

interface Analytics { currentStreak: number; totalMinutes: number; totalSessions: number; }

const STORAGE_KEY = "study-streak:motivation-date";

export default function DailyMotivation() {
  const [show,      setShow]     = useState(false);
  const [name,      setName]     = useState("");
  const [analytics, setAnalytics]= useState<Analytics | null>(null);
  const [quote,     setQuote]    = useState("");
  const [tip,       setTip]      = useState("");

  useEffect(() => {
    /* Show once per calendar day */
    const today = new Date().toDateString();
    if (localStorage.getItem(STORAGE_KEY) === today) return;

    const dayIdx = new Date().getDate();
    setQuote(QUOTES[dayIdx % QUOTES.length]);
    setTip(STUDY_TIPS[dayIdx % STUDY_TIPS.length]);

    (async () => {
      try {
        const [userRes, analyticsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/analytics"),
        ]);
        if (userRes.ok) {
          const u = await userRes.json();
          setName((u?.name ?? "").split(" ")[0]);
        }
        if (analyticsRes.ok) {
          const a = await analyticsRes.json();
          if (a && !a.error) setAnalytics({ currentStreak: a.currentStreak, totalMinutes: a.totalMinutes, totalSessions: a.totalSessions });
        }
      } catch {}
      setTimeout(() => setShow(true), 800);
    })();
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  }

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const planned  = 120; // default daily goal
  const totalHours = analytics ? Math.round(analytics.totalMinutes / 60) : 0;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 201, width: "min(480px, 90vw)",
              background: "linear-gradient(160deg,#1F1F1F,#0F0F0F)",
              borderRadius: 24, padding: 28,
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
              display: "flex", flexDirection: "column", gap: 18,
            }}
          >
            {/* Close */}
            <button onClick={dismiss}
              style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color="rgba(255,255,255,0.5)"/>
            </button>

            {/* Greeting + name */}
            <div>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                {greeting}{name ? `, ${name}` : ""}! 👋
              </motion.h2>
            </div>

            {/* Stats chips */}
            {analytics && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { icon: <Flame size={12} color="#E63946"/>, label: `${analytics.currentStreak} day streak`, color: "#E63946" },
                  { icon: <span style={{ fontSize:"0.75rem" }}>⏱</span>,  label: `${totalHours}h total`, color: "#4895EF" },
                  { icon: <span style={{ fontSize:"0.75rem" }}>📚</span>,  label: `${analytics.totalSessions} sessions`, color: "#52B788" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 99,
                    background: `${c.color}15`, border: `1px solid ${c.color}25`, fontSize: "0.75rem", color: c.color, fontWeight: 600 }}>
                    {c.icon} {c.label}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Quote */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(212,163,115,0.08)", border: "1px solid rgba(212,163,115,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Zap size={13} color="#D4A373"/>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#D4A373" }}>Today&apos;s Quote</span>
              </div>
              <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontStyle: "italic" }}>
                &ldquo;{quote}&rdquo;
              </p>
            </motion.div>

            {/* Today's mission */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Target size={14} color="#E63946"/>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E63946", textTransform: "uppercase", letterSpacing: "0.07em" }}>Today&apos;s Mission</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  `Study for at least ${planned} minutes today`,
                  analytics?.currentStreak ? `Keep your ${analytics.currentStreak}-day streak going — don't break the chain!` : "Start your first streak today — just 1 session counts!",
                  "Log every session so your AI coach can help you improve",
                ].map((goal, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(230,57,70,0.15)", border: "1.5px solid rgba(230,57,70,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: "0.5625rem", fontWeight: 800, color: "#E63946" }}>{i+1}</span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>{goal}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Study tip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(72,149,239,0.07)", border: "1px solid rgba(72,149,239,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Lightbulb size={13} color="#4895EF"/>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4895EF" }}>Study Tip</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>{tip}</p>
            </motion.div>

            {/* CTA */}
            <motion.button onClick={dismiss}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ background: "linear-gradient(135deg,#E63946,#C1121F)", border: "none", borderRadius: 12, padding: "12px 0",
                color: "#fff", fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer",
                boxShadow: "0 6px 20px rgba(230,57,70,0.35)" }}>
              Let&apos;s Get Started 🚀
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
