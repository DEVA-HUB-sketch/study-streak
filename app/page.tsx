"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Gem, Flame, Trophy, Medal, Brain, BarChart2, Bot, Check, ChevronDown, Star, GitBranch, ArrowRight, Zap } from "lucide-react";

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ to, suffix="" }: { to:number; suffix?:string }) {
  const ref   = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once:true });
  const [v, setV] = useState(0);
  useEffect(()=>{
    if(!inView) return;
    let cur=0;
    const step=Math.max(1,Math.ceil(to/60));
    const id=setInterval(()=>{ cur=Math.min(cur+step,to); setV(cur); if(cur>=to) clearInterval(id); },16);
    return ()=>clearInterval(id);
  },[inView,to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

/* ── Floating ruby ───────────────────────────────────────────── */
function FloatingRuby({ x,y,delay,size }: { x:number;y:number;delay:number;size:number }) {
  return (
    <motion.div
      style={{ position:"absolute", left:`${x}%`, top:`${y}%`, pointerEvents:"none" }}
      animate={{ y:[0,-18,0], rotate:[0,15,-10,0], opacity:[0.4,0.8,0.4] }}
      transition={{ duration:4+delay, repeat:Infinity, delay, ease:"easeInOut" }}
    >
      <div style={{ width:size, height:size, borderRadius:size*0.28, background:"linear-gradient(135deg,#E63946,#C1121F)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(230,57,70,0.45)" }}>
        <Gem size={size*0.48} color="#fff" />
      </div>
    </motion.div>
  );
}

const RUBIES = [
  {x:7,y:18,delay:0,size:26},{x:87,y:25,delay:0.9,size:20},{x:12,y:62,delay:1.6,size:22},
  {x:84,y:58,delay:0.5,size:30},{x:4,y:42,delay:2.1,size:18},{x:91,y:72,delay:1.3,size:24},
  {x:22,y:82,delay:0.7,size:16},{x:74,y:10,delay:1.9,size:22},{x:48,y:6,delay:1.1,size:18},{x:62,y:88,delay:2.3,size:20},
];

const FEATURES = [
  { icon:<BookOpenIcon/>, title:"Study Tracking",        desc:"Log every session with subject, duration, and notes. Build a complete picture of your learning.",      color:"#E63946" },
  { icon:<Flame size={22}/>, title:"Streak System",         desc:"Consecutive days build momentum. 7-day streaks unlock bonus rubies. Missing breaks the chain.",       color:"#FF6B35" },
  { icon:<Brain size={22}/>, title:"Knowledge Brain",       desc:"A living, visual brain fills with knowledge as you study. Watch it glow and pulse as you improve.",   color:"#D4A373" },
  { icon:<Trophy size={22}/>, title:"Leaderboard",          desc:"Compete with peers on hours studied, sessions logged, rubies earned, and current streak length.",     color:"#FFD700" },
  { icon:<Medal size={22}/>, title:"Achievements",          desc:"Unlock badges for milestones — First Session, 7-Day Warrior, 100 Hours Club, Ruby Collector.",        color:"#9B5DE5" },
  { icon:<BarChart2 size={22}/>, title:"Analytics",         desc:"30-day activity charts, subject distribution, study patterns — data-driven learning insights.",      color:"#4895EF" },
];

function BookOpenIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>; }

const HOW_IT_WORKS = [
  { step:"01", title:"Log a Session",        desc:"Pick your subject, set duration and date. Hit 'Log Session' to start earning." },
  { step:"02", title:"Watch Your Brain Fill", desc:"Your Knowledge Brain fills up based on daily goal progress. Aim for 100% every day." },
  { step:"03", title:"Earn Rubies & Badges",  desc:"Every session earns 1 Ruby. Streaks and milestones unlock bonus rewards and badges." },
  { step:"04", title:"Climb the Leaderboard", desc:"Your study hours, rubies, and streak place you on a global leaderboard." },
];

const TESTIMONIALS = [
  { name:"Priya R.",  college:"IIT Madras",        stars:5, text:"The brain animation is so satisfying. I went from skipping days to a 34-day streak!" },
  { name:"Arjun K.",  college:"NIT Trichy",        stars:5, text:"Ruby system gamified my GATE prep. 5 hours a day feels natural now. 10/10 product." },
  { name:"Sneha M.",  college:"BITS Pilani",       stars:5, text:"Leaderboard with batchmates changed everything. Healthy competition is 🔥" },
  { name:"Rahul D.",  college:"VIT Vellore",       stars:5, text:"Analytics showed I was studying 3 subjects and ignoring 2. Game-changer insight." },
  { name:"Kavya S.",  college:"Anna University",   stars:5, text:"200+ rubies in a month! Daily challenges keep me consistent even on bad days." },
  { name:"Vikram P.", college:"Manipal University",stars:5, text:"Recommended to my entire batch. The premium feel makes studying feel worth it." },
];

const PRICING = [
  {
    name:"Free", price:"₹0", period:"forever", highlight:false,
    features:["Unlimited sessions","Streak tracking","3 subjects","Basic achievements","7-day analytics"],
    cta:"Get Started Free",
  },
  {
    name:"Pro", price:"₹199", period:"/ month", highlight:true,
    features:["Everything in Free","Unlimited subjects","30-day analytics","Priority leaderboard","AI coaching","CSV export","Badge showcase","Early access"],
    cta:"Start Pro Trial",
  },
  {
    name:"Team", price:"₹799", period:"/ month", highlight:false,
    features:["Up to 10 members","Shared leaderboard","Group challenges","Admin dashboard","Priority support","All Pro features"],
    cta:"Contact Sales",
  },
];

const FAQ = [
  { q:"What is Study Streak?",       a:"Study Streak is a gamified study tracker for students. Log sessions, build streaks, earn ruby rewards, and compete on leaderboards." },
  { q:"Is it really free?",          a:"Yes! The core product — unlimited session logging, streak tracking, leaderboards, and achievements — is free forever." },
  { q:"How does the ruby system work?",a:"Every session = 1 Ruby. A 7-day streak adds +10, a 30-day streak adds +50, and crossing 100 hours adds +100 bonus rubies." },
  { q:"What is the Knowledge Brain?", a:"A visual SVG brain that fills with colour as you hit your daily study goal. At 100% it triggers a celebration animation." },
  { q:"Can I track multiple subjects?",a:"Yes! Create subjects with custom colours and icons. The app tracks hours per subject and shows a distribution chart." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq,  setOpenFaq]  = useState<number|null>(null);

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>50);
    window.addEventListener("scroll",h);
    return ()=>window.removeEventListener("scroll",h);
  },[]);

  return (
    <div style={{ minHeight:"100vh", background:"var(--warm-white)", color:"var(--text-primary)" }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <motion.nav
        animate={{ boxShadow: scrolled?"var(--shadow-sm)":"none" }}
        style={{
          position:"fixed", top:0, left:0, right:0, zIndex:50,
          background: scrolled?"rgba(255,253,248,0.94)":"transparent",
          backdropFilter: scrolled?"blur(16px)":"none",
          borderBottom: scrolled?"1px solid var(--border)":"none",
          transition:"all var(--t-slow)",
        }}
      >
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#E63946,#C1121F)", display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(230,57,70,0.3)" }}>
              <Gem size={16} color="#fff" />
            </div>
            <span style={{ fontWeight:800, fontSize:"1rem", color:"var(--text-primary)" }}>Study Streak</span>
          </Link>

          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <a href="#features" className="btn btn-ghost btn-sm" style={{ color:"var(--text-secondary)" }}>Features</a>
            <a href="#pricing"  className="btn btn-ghost btn-sm" style={{ color:"var(--text-secondary)" }}>Pricing</a>
            <a href="#faq"      className="btn btn-ghost btn-sm hidden sm:inline-flex" style={{ color:"var(--text-secondary)" }}>FAQ</a>
            <Link href="/login" className="btn btn-secondary btn-sm" style={{ marginLeft:4 }}>Login</Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ marginLeft:2 }}>Get Started</Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        minHeight:"100vh", display:"flex", alignItems:"center", position:"relative", overflow:"hidden",
        background:"linear-gradient(160deg,var(--charcoal) 0%,#2A2A2A 55%,#1A1412 100%)",
        paddingTop:80,
      }}>
        {/* Rubies */}
        {RUBIES.map((r,i)=><FloatingRuby key={i} {...r}/>)}

        {/* Glow blobs */}
        <div style={{ position:"absolute",top:"20%",left:"15%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,57,70,0.07),transparent 70%)",filter:"blur(80px)",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:"20%",right:"15%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,163,115,0.06),transparent 70%)",filter:"blur(60px)",pointerEvents:"none" }}/>

        {/* Bottom fade */}
        <div style={{ position:"absolute",bottom:0,left:0,right:0,height:120,background:"linear-gradient(to bottom,transparent,var(--warm-white))",pointerEvents:"none" }}/>

        <div style={{ maxWidth:1120, margin:"0 auto", padding:"60px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center", width:"100%", position:"relative", zIndex:1 }}>

          {/* Left copy */}
          <div>
            <motion.div
              initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
              style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(230,57,70,0.12)", border:"1px solid rgba(230,57,70,0.2)", borderRadius:99, padding:"5px 14px", marginBottom:20 }}
            >
              <Zap size={12} color="#E63946" />
              <span style={{ fontSize:"0.75rem", fontWeight:600, color:"#E63946" }}>Gamified Learning Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
              style={{ fontSize:"clamp(2.25rem,5vw,3.5rem)", fontWeight:900, lineHeight:1.05, letterSpacing:"-0.04em", color:"#fff", marginBottom:20 }}
            >
              Turn Study Sessions<br/>
              Into <span style={{ background:"linear-gradient(135deg,#E63946,#D4A373)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Success.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
              style={{ fontSize:"1.125rem", color:"rgba(255,255,255,0.55)", lineHeight:1.65, marginBottom:36, maxWidth:440 }}
            >
              Track progress, build streaks, earn ruby rewards, and watch your Knowledge Brain fill up every day. The EdTech platform that makes studying addictive.
            </motion.p>

            <motion.div
              initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.45 }}
              style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:32 }}
            >
              <Link href="/dashboard">
                <motion.button whileHover={{ scale:1.02,boxShadow:"0 0 30px rgba(230,57,70,0.4)" }} whileTap={{ scale:0.98 }}
                  className="btn btn-primary btn-lg">
                  Start Free — No Card <ArrowRight size={16}/>
                </motion.button>
              </Link>
              <Link href="/login">
                <button className="btn btn-lg" style={{ background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.8)",border:"1px solid rgba(255,255,255,0.12)" }}>
                  Sign In
                </button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
              style={{ display:"flex", alignItems:"center", gap:12 }}
            >
              <div style={{ display:"flex" }}>
                {["🎓","📚","⚡","🏆","💡"].map((e,i)=>(
                  <div key={i} style={{ width:28,height:28,borderRadius:"50%",background:"#2A2A2A",border:"2px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8125rem",marginLeft:i?-8:0 }}>{e}</div>
                ))}
              </div>
              <p style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.4)" }}>
                <span style={{ color:"#fff",fontWeight:700 }}>12,450+</span> students studying smarter
              </p>
            </motion.div>
          </div>

          {/* Right — product preview */}
          <motion.div
            initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.4,type:"spring",stiffness:100 }}
            style={{ display:"flex", justifyContent:"center" }}
            className="hidden lg:flex"
          >
            <div style={{
              width:"100%", maxWidth:380, borderRadius:24,
              background:"rgba(255,253,248,0.05)", border:"1px solid rgba(255,255,255,0.08)",
              boxShadow:"0 32px 80px rgba(0,0,0,0.5)", padding:20,
            }}>
              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                {[{e:"📚",v:"47",l:"Sessions"},{e:"🔥",v:"12d",l:"Streak"},{e:"💎",v:"58",l:"Rubies"}].map(s=>(
                  <div key={s.l} style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                    <p style={{ fontSize:"1.125rem",marginBottom:4 }}>{s.e}</p>
                    <p style={{ color:"#fff",fontWeight:700,fontSize:"0.9375rem" }}>{s.v}</p>
                    <p style={{ color:"rgba(255,255,255,0.4)",fontSize:"0.6875rem" }}>{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Brain preview */}
              <div style={{ background:"rgba(29,29,29,0.6)", borderRadius:16, padding:"20px 16px", marginBottom:16, textAlign:"center" }}>
                <motion.div animate={{ scale:[1,1.08,1] }} transition={{ duration:2.5,repeat:Infinity }}>
                  <span style={{ fontSize:"3.5rem" }}>🧠</span>
                </motion.div>
                <div style={{ width:"100%",height:6,borderRadius:99,background:"rgba(255,255,255,0.08)",overflow:"hidden",marginTop:10 }}>
                  <motion.div style={{ height:"100%",borderRadius:99,background:"linear-gradient(90deg,#E63946,#D4A373)" }}
                    animate={{ width:["0%","72%"] }} transition={{ duration:1.8,delay:0.6 }}/>
                </div>
                <p style={{ color:"rgba(255,255,255,0.4)",fontSize:"0.6875rem",marginTop:6 }}>72% · Daily Goal</p>
              </div>

              {/* Sessions */}
              {["Mathematics — 90 min","Physics — 60 min","Chemistry — 45 min"].map((s,i)=>(
                <motion.div key={i}
                  initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.9+i*0.1 }}
                  style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"8px 12px",marginBottom:6 }}>
                  <div style={{ width:6,height:6,borderRadius:"50%",background:"#E63946",flexShrink:0 }}/>
                  <span style={{ flex:1,fontSize:"0.8125rem",color:"rgba(255,255,255,0.65)" }}>{s}</span>
                  <Gem size={10} color="#9B5DE5" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ padding:"72px 24px", background:"var(--cream)" }}>
        <div style={{ maxWidth:900,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16 }} className="sm:grid-cols-4">
          {[{label:"Students",value:12450,suffix:"+"},{label:"Study Hours",value:580000,suffix:"+"},{label:"Rubies Earned",value:924000,suffix:"+"},{label:"Achievements",value:48600,suffix:"+"}].map(({label,value,suffix},i)=>(
            <motion.div key={label}
              initial={{ opacity:0,scale:0.9 }} whileInView={{ opacity:1,scale:1 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
              className="card card-sm"
              style={{ textAlign:"center", borderTop:`2px solid ${["#E63946","#4895EF","#9B5DE5","#D4A373"][i]}` }}
            >
              <p style={{ fontSize:"2rem",fontWeight:900,color:["#E63946","#4895EF","#9B5DE5","#D4A373"][i],marginBottom:4 }}>
                <Counter to={value} suffix={suffix}/>
              </p>
              <p style={{ fontSize:"0.8125rem",color:"var(--text-tertiary)",fontWeight:500 }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding:"96px 24px", background:"var(--warm-white)" }}>
        <div style={{ maxWidth:1120,margin:"0 auto" }}>
          <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} style={{ textAlign:"center",marginBottom:56 }}>
            <span className="badge badge-ruby" style={{ marginBottom:14, display:"inline-flex" }}>Everything You Need</span>
            <h2 style={{ fontSize:"clamp(1.75rem,4vw,2.5rem)",fontWeight:800,letterSpacing:"-0.03em",marginBottom:12 }}>Built for Serious Students</h2>
            <p style={{ fontSize:"1.0625rem",color:"var(--text-secondary)",maxWidth:500,margin:"0 auto",lineHeight:1.65 }}>
              Six powerful features that work together to turn scattered study time into unstoppable momentum.
            </p>
          </motion.div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16 }}>
            {FEATURES.map(({icon,title,desc,color},i)=>(
              <motion.div key={title}
                initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
                className="card card-hover"
                style={{ borderTop:`2px solid ${color}` }}
              >
                <div style={{ width:44,height:44,borderRadius:12,background:`${color}12`,display:"flex",alignItems:"center",justifyContent:"center",color,marginBottom:16 }}>
                  {icon}
                </div>
                <h3 style={{ fontSize:"1.0625rem",fontWeight:700,marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",lineHeight:1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding:"96px 24px",background:"var(--charcoal)" }}>
        <div style={{ maxWidth:1120,margin:"0 auto" }}>
          <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} style={{ textAlign:"center",marginBottom:56 }}>
            <span className="badge" style={{ background:"rgba(230,57,70,0.15)",color:"#E63946",marginBottom:14,display:"inline-flex" }}>Simple Process</span>
            <h2 style={{ fontSize:"clamp(1.75rem,4vw,2.5rem)",fontWeight:800,letterSpacing:"-0.03em",color:"#fff",marginBottom:12 }}>How It Works</h2>
          </motion.div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:20 }}>
            {HOW_IT_WORKS.map(({step,title,desc},i)=>(
              <motion.div key={step}
                initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                style={{ background:"rgba(255,255,255,0.04)",borderRadius:"var(--r-xl)",border:"1px solid rgba(255,255,255,0.07)",padding:24 }}
              >
                <div style={{ fontSize:"0.6875rem",fontWeight:700,color:"var(--ruby)",letterSpacing:"0.1em",marginBottom:12 }}>{step}</div>
                <h3 style={{ fontSize:"1.0625rem",fontWeight:700,color:"#fff",marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:"0.875rem",color:"rgba(255,255,255,0.45)",lineHeight:1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ padding:"96px 24px",background:"var(--cream)" }}>
        <div style={{ maxWidth:1120,margin:"0 auto" }}>
          <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} style={{ textAlign:"center",marginBottom:56 }}>
            <h2 style={{ fontSize:"clamp(1.75rem,4vw,2.5rem)",fontWeight:800,letterSpacing:"-0.03em",marginBottom:10 }}>Loved By Students</h2>
            <p style={{ fontSize:"1.0625rem",color:"var(--text-secondary)" }}>Join thousands who&apos;ve made studying their superpower.</p>
          </motion.div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
            {TESTIMONIALS.map(({name,college,stars,text},i)=>(
              <motion.div key={name}
                initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.06 }}
                className="card card-hover"
              >
                <div style={{ display:"flex",gap:3,marginBottom:12 }}>
                  {Array.from({length:stars}).map((_,j)=><Star key={j} size={13} fill="#D4A373" color="#D4A373"/>)}
                </div>
                <p style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",lineHeight:1.65,marginBottom:16 }}>&ldquo;{text}&rdquo;</p>
                <div style={{ display:"flex",alignItems:"center",gap:10,borderTop:"1px solid var(--border)",paddingTop:14 }}>
                  <div style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"0.875rem" }}>
                    {name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize:"0.875rem",fontWeight:600 }}>{name}</p>
                    <p style={{ fontSize:"0.75rem",color:"var(--text-tertiary)" }}>{college}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ padding:"96px 24px",background:"var(--warm-white)" }}>
        <div style={{ maxWidth:960,margin:"0 auto" }}>
          <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} style={{ textAlign:"center",marginBottom:56 }}>
            <h2 style={{ fontSize:"clamp(1.75rem,4vw,2.5rem)",fontWeight:800,letterSpacing:"-0.03em",marginBottom:10 }}>Simple, Honest Pricing</h2>
            <p style={{ fontSize:"1.0625rem",color:"var(--text-secondary)" }}>Start free. Upgrade when you&apos;re ready.</p>
          </motion.div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16 }}>
            {PRICING.map(({name,price,period,highlight,features,cta},i)=>(
              <motion.div key={name}
                initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className="card"
                style={{ position:"relative", border:highlight?"2px solid var(--ruby)":"1px solid var(--border)", boxShadow:highlight?"var(--shadow-ruby)":"var(--shadow-sm)" }}
              >
                {highlight && (
                  <div style={{ position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)" }}>
                    <span className="badge badge-ruby" style={{ background:"var(--ruby)",color:"#fff",boxShadow:"0 4px 12px rgba(230,57,70,0.3)" }}>Most Popular</span>
                  </div>
                )}
                <h3 style={{ fontSize:"1.125rem",fontWeight:700,marginBottom:4 }}>{name}</h3>
                <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:20 }}>
                  <span style={{ fontSize:"2.25rem",fontWeight:900,color:highlight?"var(--ruby)":"var(--text-primary)" }}>{price}</span>
                  <span style={{ fontSize:"0.875rem",color:"var(--text-tertiary)" }}>{period}</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:24 }}>
                  {features.map(f=>(
                    <div key={f} style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:16,height:16,borderRadius:"50%",background:highlight?"rgba(230,57,70,0.1)":"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <Check size={10} color={highlight?"#E63946":"#52B788"} />
                      </div>
                      <span style={{ fontSize:"0.875rem",color:"var(--text-secondary)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard">
                  <button className={`btn ${highlight?"btn-primary":"btn-secondary"}`} style={{ width:"100%" }}>
                    {cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" style={{ padding:"96px 24px",background:"var(--cream)" }}>
        <div style={{ maxWidth:680,margin:"0 auto" }}>
          <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} style={{ textAlign:"center",marginBottom:48 }}>
            <h2 style={{ fontSize:"clamp(1.75rem,4vw,2.25rem)",fontWeight:800,letterSpacing:"-0.03em",marginBottom:10 }}>Frequently Asked</h2>
          </motion.div>

          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {FAQ.map(({q,a},i)=>(
              <motion.div key={i}
                initial={{ opacity:0,y:8 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.05 }}
                className="card card-sm"
                style={{ cursor:"pointer" }}
                onClick={()=>setOpenFaq(openFaq===i?null:i)}
              >
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
                  <span style={{ fontWeight:600,fontSize:"0.9375rem" }}>{q}</span>
                  <ChevronDown size={16} color="var(--text-tertiary)" style={{ flexShrink:0,transform:openFaq===i?"rotate(180deg)":"rotate(0)",transition:"transform var(--t-base)" }}/>
                </div>
                <AnimatePresence>
                  {openFaq===i && (
                    <motion.p
                      initial={{ height:0,opacity:0,marginTop:0 }} animate={{ height:"auto",opacity:1,marginTop:10 }} exit={{ height:0,opacity:0,marginTop:0 }}
                      style={{ fontSize:"0.9375rem",color:"var(--text-secondary)",lineHeight:1.65,overflow:"hidden" }}>
                      {a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section style={{ padding:"80px 24px",background:"linear-gradient(135deg,var(--ruby),var(--ruby-dark))" }}>
        <motion.div initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} style={{ maxWidth:560,margin:"0 auto",textAlign:"center" }}>
          <Gem size={44} color="rgba(255,255,255,0.85)" style={{ margin:"0 auto 20px" }}/>
          <h2 style={{ fontSize:"clamp(1.75rem,4vw,2.5rem)",fontWeight:900,color:"#fff",letterSpacing:"-0.03em",marginBottom:14 }}>
            Start Your Streak Today
          </h2>
          <p style={{ color:"rgba(255,255,255,0.7)",fontSize:"1.0625rem",marginBottom:32,lineHeight:1.6 }}>
            Join thousands of students turning study sessions into success.
          </p>
          <Link href="/dashboard">
            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.98 }}
              className="btn btn-lg"
              style={{ background:"var(--warm-white)",color:"var(--ruby)",fontWeight:800 }}>
              Get Started Free — No Card Required
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background:"var(--charcoal)",color:"rgba(255,255,255,0.45)" }}>
        <div style={{ maxWidth:1120,margin:"0 auto",padding:"56px 24px 32px",display:"grid",gridTemplateColumns:"1fr repeat(3,auto)",gap:40,flexWrap:"wrap" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
              <div style={{ width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#E63946,#C1121F)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <Gem size={14} color="#fff"/>
              </div>
              <span style={{ color:"#fff",fontWeight:700,fontSize:"0.9375rem" }}>Study Streak</span>
            </div>
            <p style={{ fontSize:"0.875rem",lineHeight:1.6,maxWidth:220 }}>Premium EdTech platform for students who want to study smarter.</p>
          </div>
          {[
            { label:"Product",  links:["Dashboard","Features","Leaderboard","Achievements"] },
            { label:"Company",  links:["About","Contact","Privacy","Terms"] },
            { label:"Community",links:["GitHub","Discord","Twitter","Blog"] },
          ].map(({label,links})=>(
            <div key={label}>
              <h4 style={{ color:"rgba(255,255,255,0.7)",fontWeight:600,fontSize:"0.875rem",marginBottom:12 }}>{label}</h4>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {links.map(l=><a key={l} href="#" style={{ fontSize:"0.875rem",color:"rgba(255,255,255,0.4)",textDecoration:"none",transition:"color var(--t-fast)" }} className="hover:text-white">{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth:1120,margin:"0 auto",padding:"16px 24px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"0.8125rem" }}>
          <p>© 2026 Study Streak. All rights reserved.</p>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <GitBranch size={13}/><a href="#" style={{ color:"inherit",textDecoration:"none" }}>View on GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
