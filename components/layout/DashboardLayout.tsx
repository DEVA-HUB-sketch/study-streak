"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Gem } from "lucide-react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";

interface AuthUser { _id: string; name: string; email: string; }

interface DashboardLayoutProps {
  children:       React.ReactNode;
  rightPanel?:    React.ReactNode;
  user?:          AuthUser | null;
  totalRubies?:   number;
  currentStreak?: number;
  brainProgress?: number;
  studyActive?:   boolean;
}

export default function DashboardLayout({
  children,
  rightPanel,
  user,
  totalRubies   = 0,
  currentStreak = 0,
  brainProgress = 0,
  studyActive   = false,
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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--warm-white)", overflow: "hidden" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "var(--r-md)", fontSize: "0.875rem", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" },
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

      {/* ── Main column ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          borderBottom: "1px solid var(--border)",
          background: "var(--warm-white)",
          position: "sticky", top: 0, zIndex: 20,
          backdropFilter: "blur(12px)",
          flexShrink: 0,
          overflow: "hidden",
        }}>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)",
            }}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* ── Greeting (mobile: two-line stacked) ─────────────
              IMPORTANT: uses CSS class for display, NOT inline style.
              Inline `display` in style props overrides Tailwind hidden class. */}
          <div className="hdr-greeting-mobile" style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: "0.6875rem", fontWeight: 500,
              color: "var(--text-secondary)", whiteSpace: "nowrap",
            }}>
              {greeting},
            </span>
            <span style={{
              fontSize: "0.875rem", fontWeight: 800,
              color: "var(--ruby)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              /* Cap name so it never pushes right-side actions off screen */
              maxWidth: "min(200px, 45vw)",
            }}>
              {displayName}
            </span>
          </div>

          {/* ── Greeting (desktop: single line) ────────────────── */}
          <div className="hdr-greeting-desktop" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              {greeting},
            </span>
            <span style={{
              fontSize: "0.9375rem", fontWeight: 700, color: "var(--ruby)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 280,
            }}>
              {displayName}
            </span>
          </div>

          {/* ── Right actions ───────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>

            {/* Ruby counter */}
            <div id="ruby-counter" style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "var(--ruby-dim)", borderRadius: 99,
              padding: "4px 10px", flexShrink: 0,
            }}>
              <Gem size={12} color="var(--ruby)" />
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ruby)", lineHeight: 1 }}>
                {totalRubies}
              </span>
            </div>

            {/* Bell */}
            <button style={{
              width: 36, height: 36, borderRadius: 9,
              background: "none", border: "none", cursor: "pointer",
              position: "relative", color: "var(--text-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Bell size={16} />
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--ruby)", border: "1.5px solid var(--warm-white)",
              }} />
            </button>

            {/* Avatar */}
            <Link href="/profile" style={{ flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg,#E63946,#C1121F)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: "0.8125rem",
                cursor: "pointer",
              }}>{initial}</div>
            </Link>
          </div>
        </header>

        {/* ── Content + optional right panel ──────────────────── */}
        <div style={{ flex: 1, display: "flex", minWidth: 0, overflow: "hidden" }}>

          {/* Main scroll area */}
          <main style={{ flex: 1, overflowY: "auto", minWidth: 0, overflowX: "hidden" }}>
            {children}
          </main>

          {/* ── Desktop right panel (aside) ──────────────────────
              CSS class .db-sidebar-aside shows only on xl+.
              NO inline `display` property — that would override the class. */}
          {rightPanel && (
            <aside className="db-sidebar-aside">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
