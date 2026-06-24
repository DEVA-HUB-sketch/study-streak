"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Trophy, Medal, Target, BarChart2,
  User, Settings, X, Gem, Flame, ChevronRight, LogOut, Bot,
} from "lucide-react";
import dynamic from "next/dynamic";

// SSR disabled — these components use Math.sin() to compute SVG path data,
// which produces different floating-point results on Node.js vs the browser.
const KnowledgeBrain   = dynamic(() => import("@/components/brain/KnowledgeBrain"),   { ssr: false });
const FloatingKnowledge = dynamic(() => import("@/components/brain/FloatingKnowledge"), { ssr: false });

interface AuthUser { _id: string; name: string; email: string; }

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user?: AuthUser | null;
  brainProgress: number;
  currentStreak: number;
  totalRubies: number;
  studyActive: boolean;
  onLogout: () => void;
}

const NAV_SECTIONS = [
  {
    items: [
      { href:"/dashboard",   label:"Dashboard",    icon:<LayoutDashboard size={16}/> },
      { href:"/subjects",    label:"Sessions",     icon:<BookOpen size={16}/> },
      { href:"/leaderboard", label:"Leaderboard",  icon:<Trophy size={16}/> },
      { href:"/achievements",label:"Achievements", icon:<Medal size={16}/> },
    ],
  },
  {
    label:"AI & Insights",
    items:[
      { href:"/ai",          label:"AI Study Coach", icon:<Bot size={16}/> },
      { href:"/subjects",    label:"Analytics",      icon:<BarChart2 size={16}/> },
      { href:"/dashboard",   label:"Challenges",     icon:<Target size={16}/> },
    ],
  },
  {
    label:"Account",
    items:[
      { href:"/profile",     label:"Profile",      icon:<User size={16}/> },
      { href:"/dashboard",   label:"Settings",     icon:<Settings size={16}/> },
    ],
  },
];

export default function Sidebar({ open, onClose, user, brainProgress, currentStreak, totalRubies, studyActive, onLogout }: SidebarProps) {
  const path = usePathname();
  const displayName = user?.name ?? "Future Achiever";
  const initial     = displayName[0].toUpperCase();

  const inner = (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--charcoal)" }}>

      {/* ── Logo ───────────────────────────────────────── */}
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background:"linear-gradient(135deg,#E63946,#C1121F)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 20px rgba(230,57,70,0.35)",
          }}>
            <Gem size={16} color="#fff" />
          </div>
          <div>
            <p style={{ color:"#fff", fontWeight:700, fontSize:"0.875rem", lineHeight:1.2 }}>Study Streak</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.6875rem" }}>EdTech Platform</p>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden btn-ghost btn-icon" style={{ color:"rgba(255,255,255,0.4)" }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Knowledge Brain hero ────────────────────────────── */}
      <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"relative", overflow:"hidden" }}>
        {/* Section label */}
        <p style={{ fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase",
          color:"rgba(255,255,255,0.3)", marginBottom:14, textAlign:"center" }}>
          Knowledge Brain
        </p>

        {/* Floating letters container */}
        <div style={{ position:"relative" }}>
          <FloatingKnowledge active={studyActive} />
          <div style={{ display:"flex", justifyContent:"center" }}>
            <KnowledgeBrain progress={brainProgress} size={196} />
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav style={{ flex:1, padding:"16px 12px", overflowY:"auto", display:"flex", flexDirection:"column", gap:20 }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p style={{ fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase",
                color:"rgba(255,255,255,0.25)", padding:"0 10px", marginBottom:6 }}>
                {section.label}
              </p>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {section.items.map(item => {
                const active = path === item.href;
                const isAI   = item.href === "/ai";
                return (
                  <Link key={item.href+item.label} href={item.href} onClick={onClose}
                    className={`nav-item ${active ? "active" : ""}`}>
                    {item.icon}
                    <span style={{ flex:1 }}>{item.label}</span>
                    {isAI && !active && (
                      <span style={{ fontSize:"0.5625rem", fontWeight:700, padding:"2px 6px", borderRadius:99,
                        background:"rgba(155,93,229,0.2)", color:"#9B5DE5", border:"1px solid rgba(155,93,229,0.3)" }}>
                        NEW
                      </span>
                    )}
                    {active && <ChevronRight size={13} style={{ color:"rgba(230,57,70,0.7)" }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ─────────────────────────────────────── */}
      <div style={{ padding:"12px 16px 16px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        {/* Streak + Rubies chips */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <div style={{
            flex:1, display:"flex", alignItems:"center", gap:6,
            background:"rgba(230,57,70,0.12)", borderRadius:"var(--r-sm)",
            padding:"7px 10px",
          }}>
            <Flame size={13} color="#E63946" />
            <span style={{ fontSize:"0.8125rem", fontWeight:700, color:"#E63946" }}>{currentStreak}</span>
            <span style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.35)" }}>day streak</span>
          </div>
          <div style={{
            flex:1, display:"flex", alignItems:"center", gap:6,
            background:"rgba(155,93,229,0.12)", borderRadius:"var(--r-sm)",
            padding:"7px 10px",
          }}>
            <Gem size={13} color="#9B5DE5" />
            <span style={{ fontSize:"0.8125rem", fontWeight:700, color:"#9B5DE5" }}>{totalRubies}</span>
            <span style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.35)" }}>rubies</span>
          </div>
        </div>

        {/* User row */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Link href="/profile" onClick={onClose}
            style={{
              flex:1, display:"flex", alignItems:"center", gap:10, textDecoration:"none",
              padding:"8px 10px", borderRadius:"var(--r-md)",
              transition:"background var(--t-fast)",
            }}
            className="hover:bg-white/5"
          >
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"linear-gradient(135deg,#E63946,#C1121F)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"0.875rem", fontWeight:700, color:"#fff", flexShrink:0,
            }}>{initial}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:"0.8125rem", fontWeight:600, color:"#fff", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {displayName}
              </p>
              <p style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.35)" }}>Student</p>
            </div>
            <ChevronRight size={13} style={{ color:"rgba(255,255,255,0.25)", flexShrink:0 }} />
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              background:"rgba(230,57,70,0.12)", border:"none", cursor:"pointer",
              borderRadius:"var(--r-sm)", padding:"7px 8px",
              color:"rgba(230,57,70,0.8)", display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:30 }}
            className="lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col"
        style={{ width:280, flexShrink:0, height:"100vh", position:"sticky", top:0, overflowY:"auto" }}
      >
        {inner}
      </aside>

      {/* Mobile drawer */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type:"spring", stiffness:300, damping:32 }}
        style={{
          position:"fixed", top:0, left:0, height:"100vh", width:280,
          zIndex:40, overflowY:"auto",
        }}
        className="lg:hidden"
      >
        {inner}
      </motion.aside>
    </>
  );
}
