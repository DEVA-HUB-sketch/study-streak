"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const colors = ["", "#E63946", "#F4A261", "#D4A373", "#52B788"];
  const labels = ["", "Too weak", "Fair", "Good", "Strong ✓"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, transition: "background 0.3s",
            background: i <= score ? colors[score] : "var(--border)" }}/>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: colors[score] || "var(--text-tertiary)" }}>{labels[score]}</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");
  const [shake,     setShake]     = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid reset link. Please request a new one.");
  }, [token]);

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 600); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); triggerShake(); return; }
    if (password !== confirm) { setError("Passwords do not match."); triggerShake(); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed. Please try again."); triggerShake(); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "none", flexDirection: "column", alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg,var(--charcoal) 0%,#2A2A2A 55%,#1A1412 100%)",
        position: "relative", overflow: "hidden", padding: "60px 48px" }}
        className="lg:flex">
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
              <p style={{ color: "#fff", fontWeight: 800, fontSize: "1.0625rem" }}>Study Streak</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>EdTech Platform</p>
            </div>
          </div>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "5.5rem", lineHeight: 1, marginBottom: 28 }}>🔐</motion.div>
          <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>
            Create New Password
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
            Choose a strong password to keep your Study Streak account safe.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", background: "var(--warm-white)" }}>
        <motion.div
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
          style={{ width: "100%", maxWidth: 380 }}>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10,
            textDecoration: "none", marginBottom: 36 }} className="lg:hidden">
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg,#E63946,#C1121F)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gem size={15} color="#fff"/>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>Study Streak</span>
          </Link>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "32px 0" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  style={{ display: "inline-flex", width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(82,183,136,0.12)", border: "2px solid rgba(82,183,136,0.3)",
                    alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <CheckCircle size={32} color="#52B788"/>
                </motion.div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)",
                  letterSpacing: "-0.02em", marginBottom: 10 }}>Password reset!</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
                  Your password has been updated. Redirecting you to sign in…
                </p>
              </motion.div>
            ) : !token ? (
              <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: "center", padding: "32px 0" }}>
                <AlertCircle size={48} color="#E63946" style={{ margin: "0 auto 16px" }}/>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>
                  Invalid Reset Link
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                  This link is invalid or has expired. Please request a new one.
                </p>
                <Link href="/forgot-password" className="btn btn-primary">Request New Link</Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)",
                  letterSpacing: "-0.03em", marginBottom: 6 }}>New password</h1>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
                  Must be at least 8 characters.
                </p>

                <motion.form onSubmit={handleSubmit}
                  animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  <div>
                    <div style={{ position: "relative" }}>
                      <Lock size={15} color="var(--text-tertiary)"
                        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
                      <input type={showPass ? "text" : "password"} placeholder="New password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        required className="input-base input-icon" style={{ paddingRight: 44 }}/>
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                        {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    <StrengthBar password={password}/>
                  </div>

                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="var(--text-tertiary)"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
                    <input type={showPass ? "text" : "password"} placeholder="Confirm new password"
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      required className="input-base input-icon"
                      style={{ borderColor: confirm && confirm !== password ? "var(--ruby)" : undefined }}/>
                  </div>

                  {error && <p style={{ fontSize: "0.8125rem", color: "var(--ruby)", fontWeight: 500 }}>{error}</p>}

                  <motion.button type="submit" disabled={loading}
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.99 } : {}}
                    className="btn btn-primary" style={{ width: "100%", fontSize: "0.9375rem", marginTop: 4 }}>
                    {loading
                      ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                          <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                            animation: "spin 0.8s linear infinite" }}/>
                          Updating…
                        </span>
                      : "Reset Password"
                    }
                  </motion.button>

                  <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-tertiary)" }}>
                    <Link href="/login" style={{ color: "var(--ruby)", fontWeight: 600, textDecoration: "none" }}>
                      Back to sign in
                    </Link>
                  </p>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
