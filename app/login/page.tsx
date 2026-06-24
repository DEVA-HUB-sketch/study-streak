"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gem, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

const QUOTE = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

export default function LoginPage() {
  const router = useRouter();
  const [form,     setForm]     = useState({ email:"", password:"", remember:false });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        style={{
          flex:1, display:"none", flexDirection:"column", alignItems:"center", justifyContent:"center",
          background:"linear-gradient(160deg,var(--charcoal) 0%,#2A2A2A 55%,#1A1412 100%)",
          position:"relative", overflow:"hidden", padding:"60px 48px",
        }}
        className="lg:flex"
      >
        {/* Glow */}
        <div style={{ position:"absolute",top:"25%",left:"25%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,57,70,0.1),transparent 70%)",filter:"blur(60px)",pointerEvents:"none" }}/>

        <div style={{ position:"relative",zIndex:1,textAlign:"center",maxWidth:340 }}>
          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:48 }}>
            <div style={{ width:42,height:42,borderRadius:13,background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 28px rgba(230,57,70,0.4)" }}>
              <Gem size={20} color="#fff"/>
            </div>
            <div style={{ textAlign:"left" }}>
              <p style={{ color:"#fff",fontWeight:800,fontSize:"1.0625rem",lineHeight:1.2 }}>Study Streak</p>
              <p style={{ color:"rgba(255,255,255,0.35)",fontSize:"0.75rem" }}>EdTech Platform</p>
            </div>
          </div>

          {/* Brain */}
          <motion.div animate={{ y:[0,-12,0] }} transition={{ duration:3.5,repeat:Infinity,ease:"easeInOut" }}
            style={{ fontSize:"5.5rem",lineHeight:1,marginBottom:28 }}>🧠</motion.div>

          <h2 style={{ fontSize:"1.625rem",fontWeight:800,color:"#fff",letterSpacing:"-0.03em",marginBottom:10 }}>Welcome Back!</h2>
          <p style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.9375rem",lineHeight:1.65,marginBottom:32 }}>
            Your streak is waiting.<br/>Your brain is ready to learn.
          </p>

          {/* Quote card */}
          <div style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"16px 20px" }}>
            <p style={{ fontSize:"0.875rem",fontStyle:"italic",color:"rgba(255,255,255,0.5)",lineHeight:1.6 }}>
              &ldquo;{QUOTE}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", background:"var(--warm-white)" }}>
        <motion.div
          initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }}
          transition={{ type:"spring", stiffness:160, damping:22 }}
          style={{ width:"100%", maxWidth:380 }}
        >
          {/* Mobile logo */}
          <Link href="/" style={{ display:"flex",alignItems:"center",gap:10,textDecoration:"none",marginBottom:36 }} className="lg:hidden">
            <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Gem size={15} color="#fff"/>
            </div>
            <span style={{ fontWeight:800,fontSize:"1rem",color:"var(--text-primary)" }}>Study Streak</span>
          </Link>

          <h1 style={{ fontSize:"1.875rem",fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.03em",marginBottom:6 }}>Sign in</h1>
          <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",marginBottom:28 }}>
            New here?{" "}
            <Link href="/signup" style={{ color:"var(--ruby)",fontWeight:600,textDecoration:"none" }}>Create an account</Link>
          </p>

          {/* Google (placeholder — requires OAuth setup) */}
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
            type="button" disabled
            className="btn btn-secondary"
            style={{ width:"100%", marginBottom:20, gap:12, fontSize:"0.9375rem", opacity:0.5, cursor:"not-allowed" }}>
            <span style={{ fontSize:"1.125rem",fontWeight:700 }}>G</span>
            Continue with Google
          </motion.button>

          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
            <div className="divider" style={{ flex:1 }}/>
            <span style={{ fontSize:"0.8125rem",color:"var(--text-tertiary)",whiteSpace:"nowrap" }}>or continue with email</span>
            <div className="divider" style={{ flex:1 }}/>
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {/* Email */}
            <div style={{ position:"relative" }}>
              <Mail size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))} required
                className="input-base input-icon"/>
            </div>

            {/* Password */}
            <div style={{ position:"relative" }}>
              <Lock size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
              <input type={showPass?"text":"password"} placeholder="Password" value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))} required
                className="input-base input-icon" style={{ paddingRight:44 }}/>
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-tertiary)" }}>
                {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
                <input type="checkbox" checked={form.remember} onChange={e=>setForm(f=>({...f,remember:e.target.checked}))}
                  style={{ width:15,height:15,accentColor:"var(--ruby)" }}/>
                <span style={{ fontSize:"0.875rem",color:"var(--text-secondary)" }}>Remember me</span>
              </label>
              <a href="#" style={{ fontSize:"0.875rem",color:"var(--ruby)",fontWeight:500,textDecoration:"none" }}>
                Forgot password?
              </a>
            </div>

            {error && <p style={{ fontSize:"0.8125rem",color:"var(--ruby)",fontWeight:500 }}>{error}</p>}

            <motion.button type="submit" disabled={loading}
              whileHover={!loading?{ scale:1.01 }:{}} whileTap={!loading?{ scale:0.99 }:{}}
              className="btn btn-primary" style={{ width:"100%",fontSize:"0.9375rem",marginTop:4 }}>
              {loading
                ? <span style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/>
                    Signing in…
                  </span>
                : "Sign In"
              }
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
