"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Mail, ArrowLeft, CheckCircle } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [state,   setState]   = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [shake,   setShake]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setState("error");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setState("loading");
    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      // Always show success to prevent user enumeration
      setState("success");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── Left panel (same as login) ─────────────────────── */}
      <div
        style={{
          flex: 1, display: "none", flexDirection: "column", alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg,var(--charcoal) 0%,#2A2A2A 55%,#1A1412 100%)",
          position: "relative", overflow: "hidden", padding: "60px 48px",
        }}
        className="lg:flex"
      >
        <div style={{ position: "absolute", top: "25%", left: "25%", width: 300, height: 300,
          borderRadius: "50%", background: "radial-gradient(circle,rgba(230,57,70,0.1),transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none" }}/>

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 340 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13,
              background: "linear-gradient(135deg,#E63946,#C1121F)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 28px rgba(230,57,70,0.4)" }}>
              <Gem size={20} color="#fff"/>
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: "1.0625rem", lineHeight: 1.2 }}>Study Streak</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>EdTech Platform</p>
            </div>
          </div>

          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "5.5rem", lineHeight: 1, marginBottom: 28 }}>🔑</motion.div>

          <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>
            Forgot Your Password?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
            No worries! Enter your email and we&apos;ll send you a secure link to reset it.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", background: "var(--warm-white)" }}>
        <motion.div
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
          style={{ width: "100%", maxWidth: 380 }}
        >
          {/* Mobile logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10,
            textDecoration: "none", marginBottom: 36 }} className="lg:hidden">
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg,#E63946,#C1121F)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gem size={15} color="#fff"/>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>Study Streak</span>
          </Link>

          <Link href="/login" style={{ display: "flex", alignItems: "center", gap:6,
            color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem",
            marginBottom: 28, width: "fit-content" }}>
            <ArrowLeft size={15}/> Back to sign in
          </Link>

          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "32px 0" }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  style={{ display: "inline-flex", width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(82,183,136,0.12)", border: "2px solid rgba(82,183,136,0.3)",
                    alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <CheckCircle size={32} color="#52B788"/>
                </motion.div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)",
                  letterSpacing: "-0.02em", marginBottom: 10 }}>Check your email</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65, marginBottom: 28 }}>
                  We&apos;ve sent a password reset link to <strong>{email}</strong>.
                  It expires in 1 hour.
                </p>
                <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
                  Didn&apos;t receive it?{" "}
                  <button onClick={() => { setState("idle"); }}
                    style={{ color: "var(--ruby)", fontWeight: 600, background: "none",
                      border: "none", cursor: "pointer", fontSize: "0.875rem" }}>
                    Try again
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)",
                  letterSpacing: "-0.03em", marginBottom: 6 }}>Reset password</h1>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
                  Enter your account email and we&apos;ll send you a reset link.
                </p>

                <motion.form onSubmit={handleSubmit}
                  animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  <div style={{ position: "relative" }}>
                    <Mail size={15} color="var(--text-tertiary)"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
                    <input type="email" placeholder="Email address" value={email}
                      onChange={e => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                      required className="input-base input-icon"
                      style={{ borderColor: state === "error" ? "var(--ruby)" : undefined }}/>
                  </div>

                  {state === "error" && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--ruby)", fontWeight: 500 }}>{message}</p>
                  )}

                  <motion.button type="submit" disabled={state === "loading"}
                    whileHover={state !== "loading" ? { scale: 1.01 } : {}}
                    whileTap={state !== "loading" ? { scale: 0.99 } : {}}
                    className="btn btn-primary"
                    style={{ width: "100%", fontSize: "0.9375rem", marginTop: 4 }}>
                    {state === "loading"
                      ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                          <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                            animation: "spin 0.8s linear infinite" }}/>
                          Sending…
                        </span>
                      : "Send Reset Link"
                    }
                  </motion.button>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
