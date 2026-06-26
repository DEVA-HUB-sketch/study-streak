"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Gem, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";

interface AuthUser { _id: string; name: string; email: string; }

interface DashboardLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  user?: AuthUser | null;
  totalRubies?: number;
  currentStreak?: number;
  brainProgress?: number;
  studyActive?: boolean;
}

export default function DashboardLayout({
  children,
  rightPanel,
  user,
  totalRubies = 0,
  currentStreak = 0,
  brainProgress = 0,
  studyActive = false,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  })();

  const displayName = user?.name ?? "Future Achiever";
  const initial     = displayName[0].toUpperCase();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--warm-white)" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius:"var(--r-md)", fontSize:"0.875rem", boxShadow:"var(--shadow-md)", border:"1px solid var(--border)" },
        }}
      />

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        brainProgress={brainProgress}
        currentStreak={currentStreak}
        totalRubies={totalRubies}
        studyActive={studyActive}
        onLogout={handleLogout}
      />

      {/* ── Main area ─────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Top header */}
        <header style={{
          height:60, display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 20px", borderBottom:"1px solid var(--border)",
          background:"var(--warm-white)", position:"sticky", top:0, zIndex:20,
          backdropFilter:"blur(12px)",
        }}>
          {/* Left: hamburger + greeting */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn btn-ghost btn-icon lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:"0.9375rem", fontWeight:700, color:"var(--text-primary)" }}>
                {greeting},
              </span>
              <span style={{ fontSize:"0.9375rem", fontWeight:700, color:"var(--ruby)" }}>
                {displayName}
              </span>
            </div>
          </div>

          {/* Right: search, rubies, bell, avatar */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="btn btn-ghost btn-icon hidden sm:flex" style={{ color:"var(--text-secondary)" }}>
              <Search size={17} />
            </button>

            <div id="ruby-counter" style={{
              display:"flex", alignItems:"center", gap:5,
              background:"var(--ruby-dim)", borderRadius:99,
              padding:"5px 12px",
            }}>
              <Gem size={13} color="var(--ruby)" />
              <span style={{ fontSize:"0.8125rem", fontWeight:700, color:"var(--ruby)" }}>
                {totalRubies}
              </span>
            </div>

            <button className="btn btn-ghost btn-icon" style={{ position:"relative", color:"var(--text-secondary)" }}>
              <Bell size={17} />
              <span style={{
                position:"absolute", top:8, right:8,
                width:7, height:7, borderRadius:"50%",
                background:"var(--ruby)", border:"1.5px solid var(--warm-white)",
              }} />
            </button>

            <Link href="/profile">
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background:"linear-gradient(135deg,#E63946,#C1121F)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontWeight:700, fontSize:"0.8125rem",
                cursor:"pointer",
              }}>{initial}</div>
            </Link>
          </div>
        </header>

        {/* Content + optional right panel */}
        <div style={{ flex:1, display:"flex", minWidth:0 }}>
          <main style={{ flex:1, overflowY:"auto", minWidth:0, padding:"0 16px" }}>
            {children}
          </main>

          {rightPanel && (
            <aside
              style={{
                width:320, flexShrink:0,
                overflowY:"auto",
                borderLeft:"1px solid var(--border)",
                background:"var(--cream)",
                padding:20,
                /* No `display` here — Tailwind's `hidden xl:flex` controls visibility.
                   Inline display overrides class-based display, breaking responsive hide. */
                flexDirection:"column", gap:16,
              }}
              className="hidden xl:flex flex-col"
            >
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
