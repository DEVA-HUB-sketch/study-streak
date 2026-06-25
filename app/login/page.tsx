"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Gem, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

const QUOTE = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

/* ── Google SVG icon ─────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.5 1.2 8.9 3.2l6.6-6.6C35.4 2.6 30 0 24 0 14.6 0 6.5 5.5 2.8 13.5l7.7 6C12.2 13.4 17.6 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3.1-2.3 5.7-4.8 7.5l7.5 5.8c4.4-4 6.9-10 6.9-17.3z"/>
      <path fill="#FBBC05" d="M10.5 28.6A14.3 14.3 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.7-6C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.6l7.9-6z"/>
      <path fill="#34A853" d="M24 48c6 0 11-2 14.7-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.2 2.2-6.4 0-11.8-4-13.7-9.4l-7.9 6C6.5 42.5 14.6 48 24 48z"/>
    </svg>
  );
}

const OAUTH_ERRORS: Record<string, string> = {
  google_denied:          "Google sign-in was cancelled.",
  google_failed:          "Google sign-in failed. Please try again.",
  invalid_state:          "Security check failed. Please try again.",
  google_not_registered:  "No account found for this Google email. Please sign up first.",
};

/* Wrap in Suspense because useSearchParams() requires it at build time */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [form,     setForm]     = useState({ email: "", password: "", remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [shake,    setShake]    = useState(false);

  /* Show OAuth error if redirected back with ?error= */
  useEffect(() => {
    const oauthErr = searchParams.get("error");
    if (oauthErr) setError(OAUTH_ERRORS[oauthErr] ?? "Authentication failed. Please try again.");
  }, [searchParams]);

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 600); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        triggerShake();
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      triggerShake();
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg,var(--charcoal) 0%,#2A2A2A 55%,#1A1412 100%)",
        position: "relative", overflow: "hidden", padding: "60px 48px",
      }} className="lg:flex">
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
            style={{ fontSize: "5.5rem", lineHeight: 1, marginBottom: 28 }}>🧠</motion.div>
          <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>
            Welcome Back!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9375rem", lineHeight: 1.65, marginBottom: 32 }}>
            Your streak is waiting.<br/>Your brain is ready to learn.
          </p>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 20px" }}>
            <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              &ldquo;{QUOTE}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", background: "var(--warm-white)" }}>
        <motion.div
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
          style={{ width: "100%", maxWidth: 380 }}>

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

          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)",
            letterSpacing: "-0.03em", marginBottom: 6 }}>Sign in</h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
            New here?{" "}
            <Link href="/signup" style={{ color: "var(--ruby)", fontWeight: 600, textDecoration: "none" }}>
              Create an account
            </Link>
          </p>

          {/* ── Google Sign-In ──────────────────────────────── */}
          <motion.a
            href="/api/auth/google"
            whileHover={{ scale: 1.01, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.99 }}
            className="btn btn-secondary"
            style={{ width: "100%", marginBottom: 20, gap: 10, fontSize: "0.9375rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none" }}>
            <GoogleIcon/>
            Continue with Google
          </motion.a>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div className="divider" style={{ flex: 1 }}/>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
              or continue with email
            </span>
            <div className="divider" style={{ flex: 1 }}/>
          </div>

          {/* ── Email/Password form ─────────────────────────── */}
          <motion.form onSubmit={handleSubmit}
            animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ position: "relative" }}>
              <Mail size={15} color="var(--text-tertiary)"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                className="input-base input-icon"/>
            </div>

            <div style={{ position: "relative" }}>
              <Lock size={15} color="var(--text-tertiary)"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
              <input type={showPass ? "text" : "password"} placeholder="Password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                className="input-base input-icon" style={{ paddingRight: 44 }}/>
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={form.remember}
                  onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                  style={{ width: 15, height: 15, accentColor: "var(--ruby)" }}/>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Remember me</span>
              </label>
              {/* Now links to the real forgot password page */}
              <Link href="/forgot-password"
                style={{ fontSize: "0.875rem", color: "var(--ruby)", fontWeight: 500, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: "0.8125rem", color: "var(--ruby)", fontWeight: 500 }}>
                {error}
              </motion.p>
            )}

            <motion.button type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className="btn btn-primary" style={{ width: "100%", fontSize: "0.9375rem", marginTop: 4 }}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                      animation: "spin 0.8s linear infinite" }}/>
                    Signing in…
                  </span>
                : "Sign In"
              }
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
