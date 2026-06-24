"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Mail, Lock, User, GraduationCap, Eye, EyeOff, Check, Target, Palette } from "lucide-react";

/* ── Password strength ─────────────────────────────────────── */
function strengthScore(pw: string) {
  let s=0;
  if(pw.length>=8)           s++;
  if(/[A-Z]/.test(pw))       s++;
  if(/[0-9]/.test(pw))       s++;
  if(/[^A-Za-z0-9]/.test(pw))s++;
  const map: Record<number,{label:string;color:string}> = {
    0:{label:"",color:"var(--border-strong)"},
    1:{label:"Too weak",color:"#E63946"},
    2:{label:"Fair",color:"#FF6B35"},
    3:{label:"Good",color:"#D4A373"},
    4:{label:"Strong ✓",color:"#52B788"},
  };
  return { score:s, ...map[s] };
}

const STUDY_GOALS = ["Exam Preparation","Daily Learning","Skill Building","Research","Language Learning","Professional Development"];
const SUBJECTS    = ["Mathematics","Physics","Chemistry","Biology","Computer Science","English","History","Economics"];

const STEPS = [
  { id:"account",  label:"Account",     icon:<Mail size={14}/> },
  { id:"profile",  label:"Profile",     icon:<User size={14}/> },
  { id:"goals",    label:"Goals",       icon:<Target size={14}/> },
  { id:"success",  label:"Done",        icon:<Check size={14}/> },
];

export default function SignupPage() {
  const router = useRouter();
  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [errors,    setErrors]    = useState<Record<string,string>>({});
  const [form, setForm] = useState({
    name:"", email:"", password:"", confirmPassword:"",
    college:"", department:"",
    goals:[] as string[], subjects:[] as string[],
  });

  const setF = (k:keyof typeof form) => (e:React.ChangeEvent<HTMLInputElement>) =>
    setForm(f=>({...f,[k]:e.target.value}));

  const pw = strengthScore(form.password);

  function validate0() {
    const e:Record<string,string>={};
    if(!form.name.trim())         e.name="Name is required";
    if(!form.email.includes("@")) e.email="Valid email required";
    if(form.password.length<8)    e.password="At least 8 characters";
    if(form.password!==form.confirmPassword) e.confirmPassword="Passwords don't match";
    setErrors(e); return Object.keys(e).length===0;
  }
  function validate1() {
    const e:Record<string,string>={};
    if(!form.college.trim())    e.college="College is required";
    if(!form.department.trim()) e.department="Department is required";
    setErrors(e); return Object.keys(e).length===0;
  }

  async function next() {
    if(step===0 && !validate0()) return;
    if(step===1 && !validate1()) return;
    if(step===2) {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            college: form.college,
            department: form.department,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrors({ general: data.error || "Registration failed" });
          setLoading(false);
          return;
        }
        setStep(3);
        setTimeout(() => router.push("/login"), 2500);
      } catch {
        setErrors({ general: "Network error. Please try again." });
      }
      setLoading(false);
      return;
    }
    if(step<3) setStep(s=>s+1);
  }

  function toggleGoal(g:string) { setForm(f=>({ ...f, goals: f.goals.includes(g)?f.goals.filter(x=>x!==g):[...f.goals,g] })); }
  function toggleSubject(s:string) { setForm(f=>({ ...f, subjects: f.subjects.includes(s)?f.subjects.filter(x=>x!==s):[...f.subjects,s] })); }

  const inputStyle = { background:"var(--warm-white)", border:"1.5px solid var(--border-strong)" };

  return (
    <div style={{ minHeight:"100vh", display:"flex" }}>

      {/* ── Left panel ──────────────────────────────────────── */}
      <div style={{ flex:1, display:"none", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,var(--charcoal) 0%,#2A2A2A 60%,#1A1412 100%)", position:"relative", overflow:"hidden", padding:"60px 48px" }} className="lg:flex">
        <div style={{ position:"absolute",top:"20%",right:"20%",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,57,70,0.08),transparent 70%)",filter:"blur(50px)",pointerEvents:"none" }}/>

        <div style={{ position:"relative",zIndex:1,textAlign:"center",maxWidth:340 }}>
          <Link href="/" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,textDecoration:"none",marginBottom:48 }}>
            <div style={{ width:42,height:42,borderRadius:13,background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 28px rgba(230,57,70,0.4)" }}>
              <Gem size={20} color="#fff"/>
            </div>
            <div style={{ textAlign:"left" }}>
              <p style={{ color:"#fff",fontWeight:800,fontSize:"1.0625rem" }}>Study Streak</p>
              <p style={{ color:"rgba(255,255,255,0.35)",fontSize:"0.75rem" }}>EdTech Platform</p>
            </div>
          </Link>

          <motion.div animate={{ scale:[1,1.08,1],rotate:[0,3,-3,0] }} transition={{ duration:4,repeat:Infinity,ease:"easeInOut" }}
            style={{ fontSize:"5rem",lineHeight:1,marginBottom:28 }}>🚀</motion.div>

          <h2 style={{ fontSize:"1.625rem",fontWeight:800,color:"#fff",letterSpacing:"-0.03em",marginBottom:10 }}>Join the Community</h2>
          <p style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.9375rem",lineHeight:1.65,marginBottom:32 }}>
            12,450+ students already building their future with Study Streak.
          </p>

          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {["Free forever — no credit card","Earn rubies & unlock badges","Real-time leaderboard","Daily AI motivation"].map(b=>(
              <div key={b} style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:18,height:18,borderRadius:"50%",background:"rgba(82,183,136,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Check size={10} color="#52B788"/>
                </div>
                <span style={{ fontSize:"0.875rem",color:"rgba(255,255,255,0.55)" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",background:"var(--warm-white)",overflowY:"auto" }}>
        <div style={{ width:"100%",maxWidth:400 }}>

          {/* Mobile logo */}
          <Link href="/" style={{ display:"flex",alignItems:"center",gap:10,textDecoration:"none",marginBottom:32 }} className="lg:hidden">
            <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Gem size={14} color="#fff"/>
            </div>
            <span style={{ fontWeight:800,fontSize:"0.9375rem",color:"var(--text-primary)" }}>Study Streak</span>
          </Link>

          {/* Step indicator */}
          <div style={{ display:"flex",alignItems:"center",gap:0,marginBottom:32 }}>
            {STEPS.map((s,i)=>(
              <div key={s.id} style={{ display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"initial" }}>
                <div style={{ display:"flex",alignItems:"center",gap:7,flexShrink:0 }}>
                  <div style={{
                    width:28,height:28,borderRadius:"50%",
                    background:i<step?"#52B788":i===step?"var(--ruby)":"var(--cream)",
                    border:`2px solid ${i<step?"#52B788":i===step?"var(--ruby)":"var(--border-strong)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"all var(--t-base)",
                  }}>
                    {i<step ? <Check size={12} color="#fff"/> : <span style={{ color:i===step?"#fff":"var(--text-tertiary)",fontSize:"0.75rem",fontWeight:700 }}>{i+1}</span>}
                  </div>
                  <span style={{ fontSize:"0.75rem",fontWeight:600,color:i===step?"var(--text-primary)":"var(--text-tertiary)" }} className="hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {i<STEPS.length-1 && (
                  <div style={{ flex:1,height:2,background:i<step?"#52B788":"var(--border)",margin:"0 8px",transition:"background var(--t-base)" }}/>
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 0: Account ─────────────────────────── */}
            {step===0 && (
              <motion.div key="s0" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} transition={{ duration:0.25 }}>
                <h1 style={{ fontSize:"1.75rem",fontWeight:800,letterSpacing:"-0.03em",marginBottom:6 }}>Create account</h1>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",marginBottom:24 }}>
                  Have an account? <Link href="/login" style={{ color:"var(--ruby)",fontWeight:600,textDecoration:"none" }}>Sign in</Link>
                </p>
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <div style={{ position:"relative" }}>
                    <User size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
                    <input placeholder="Full name" value={form.name} onChange={setF("name")} className="input-base input-icon" style={inputStyle}/>
                    {errors.name && <p style={{ fontSize:"0.75rem",color:"var(--ruby)",marginTop:4 }}>{errors.name}</p>}
                  </div>
                  <div style={{ position:"relative" }}>
                    <Mail size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
                    <input type="email" placeholder="Email address" value={form.email} onChange={setF("email")} className="input-base input-icon" style={inputStyle}/>
                    {errors.email && <p style={{ fontSize:"0.75rem",color:"var(--ruby)",marginTop:4 }}>{errors.email}</p>}
                  </div>
                  <div>
                    <div style={{ position:"relative" }}>
                      <Lock size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
                      <input type={showPass?"text":"password"} placeholder="Password" value={form.password} onChange={setF("password")} className="input-base input-icon" style={{ ...inputStyle,paddingRight:44 }}/>
                      <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-tertiary)" }}>
                        {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                    {form.password && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ display:"flex",gap:4,marginBottom:4 }}>
                          {[1,2,3,4].map(i=><div key={i} style={{ flex:1,height:3,borderRadius:99,background:i<=pw.score?pw.color:"var(--border)",transition:"background var(--t-fast)" }}/>)}
                        </div>
                        <p style={{ fontSize:"0.6875rem",color:pw.color }}>{pw.label}</p>
                      </div>
                    )}
                    {errors.password && <p style={{ fontSize:"0.75rem",color:"var(--ruby)",marginTop:4 }}>{errors.password}</p>}
                  </div>
                  <div style={{ position:"relative" }}>
                    <Lock size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
                    <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={setF("confirmPassword")} className="input-base input-icon" style={{ ...inputStyle,paddingRight:44 }}/>
                    {form.confirmPassword && form.password===form.confirmPassword && (
                      <Check size={14} color="#52B788" style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)" }}/>
                    )}
                    {errors.confirmPassword && <p style={{ fontSize:"0.75rem",color:"var(--ruby)",marginTop:4 }}>{errors.confirmPassword}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Profile ─────────────────────────── */}
            {step===1 && (
              <motion.div key="s1" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} transition={{ duration:0.25 }}>
                <h1 style={{ fontSize:"1.75rem",fontWeight:800,letterSpacing:"-0.03em",marginBottom:6 }}>Your profile</h1>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",marginBottom:24 }}>Help us personalise your experience.</p>
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <div style={{ position:"relative" }}>
                    <GraduationCap size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
                    <input placeholder="College / University" value={form.college} onChange={setF("college")} className="input-base input-icon" style={inputStyle}/>
                    {errors.college && <p style={{ fontSize:"0.75rem",color:"var(--ruby)",marginTop:4 }}>{errors.college}</p>}
                  </div>
                  <div style={{ position:"relative" }}>
                    <GraduationCap size={15} color="var(--text-tertiary)" style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}/>
                    <input placeholder="Department / Branch" value={form.department} onChange={setF("department")} className="input-base input-icon" style={inputStyle}/>
                    {errors.department && <p style={{ fontSize:"0.75rem",color:"var(--ruby)",marginTop:4 }}>{errors.department}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Goals ────────────────────────────── */}
            {step===2 && (
              <motion.div key="s2" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} transition={{ duration:0.25 }}>
                <h1 style={{ fontSize:"1.75rem",fontWeight:800,letterSpacing:"-0.03em",marginBottom:6 }}>Your goals</h1>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",marginBottom:20 }}>What are you studying for? (Pick all that apply)</p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:24 }}>
                  {STUDY_GOALS.map(g=>{
                    const active=form.goals.includes(g);
                    return (
                      <button key={g} onClick={()=>toggleGoal(g)} type="button" className="btn btn-sm"
                        style={{ background:active?"var(--ruby-dim)":"var(--cream)", color:active?"var(--ruby)":"var(--text-secondary)", border:`1.5px solid ${active?"var(--ruby)":"var(--border-strong)"}`, fontWeight:active?600:400 }}>
                        {active && <Check size={11}/>} {g}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",marginBottom:12 }}>Favourite subjects:</p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                  {SUBJECTS.map(s=>{
                    const active=form.subjects.includes(s);
                    return (
                      <button key={s} onClick={()=>toggleSubject(s)} type="button" className="btn btn-sm"
                        style={{ background:active?"rgba(72,149,239,0.1)":"var(--cream)", color:active?"#4895EF":"var(--text-secondary)", border:`1.5px solid ${active?"#4895EF":"var(--border-strong)"}`, fontWeight:active?600:400 }}>
                        {active && <Check size={11}/>} {s}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Success ──────────────────────────── */}
            {step===3 && (
              <motion.div key="s3" initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} style={{ textAlign:"center",padding:"20px 0" }}>
                <motion.div animate={{ scale:[1,1.1,1],rotate:[0,8,-8,0] }} transition={{ duration:1.2,repeat:Infinity }}>
                  <div style={{ width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 40px rgba(230,57,70,0.4)" }}>
                    <Gem size={32} color="#fff"/>
                  </div>
                </motion.div>
                <h2 style={{ fontSize:"1.75rem",fontWeight:800,letterSpacing:"-0.03em",marginBottom:8 }}>Welcome aboard! 🎉</h2>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",marginBottom:24 }}>Setting up your dashboard…</p>
                <div style={{ height:4,borderRadius:99,background:"var(--cream)",overflow:"hidden" }}>
                  <motion.div style={{ height:"100%",borderRadius:99,background:"linear-gradient(90deg,var(--ruby),var(--gold))" }}
                    animate={{ width:"100%" }} transition={{ duration:2.2 }}/>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* General error */}
          {errors.general && (
            <p style={{ fontSize:"0.8125rem",color:"var(--ruby)",fontWeight:500,marginTop:12 }}>
              {errors.general}
            </p>
          )}

          {/* Navigation */}
          {step<3 && (
            <div style={{ display:"flex",gap:10,marginTop:24 }}>
              {step>0 && (
                <button onClick={()=>setStep(s=>s-1)} className="btn btn-secondary" style={{ paddingLeft:20,paddingRight:20 }}>
                  Back
                </button>
              )}
              <motion.button
                whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                onClick={next} disabled={loading}
                className="btn btn-primary" style={{ flex:1 }}>
                {loading
                  ? <span style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/>
                      Creating…
                    </span>
                  : step===2 ? "Create My Account 🚀" : "Continue"
                }
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
