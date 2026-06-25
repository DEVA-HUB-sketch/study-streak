"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Lock, User, Bell, Shield, Trash2,
  Eye, EyeOff, CheckCircle, ChevronRight, Globe,
  Moon, Sun, Clock,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Section card ────────────────────────────────────────────── */
function Section({ title, icon, children, accent = "var(--ruby)" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--cream)", border: "1px solid var(--border)",
        borderRadius: 20, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: accent }}>{icon}</span>
        <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{title}</h2>
      </div>
      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ── Setting row ──────────────────────────────────────────────── */
function Row({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 36 }}>
      <div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-primary)" }}>{label}</p>
        {sub && <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: 1 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Toggle switch ────────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} type="button"
      style={{ width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
        background: value ? "var(--ruby)" : "var(--border-strong)",
        position: "relative", transition: "background 200ms", flexShrink: 0 }}>
      <motion.span
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
          background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", display: "block" }}/>
    </button>
  );
}

/* ── Input field ──────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
const INP = { className: "input-base", style: { background: "var(--warm-white)", fontSize: "0.9375rem" } as React.CSSProperties };

/* ═══════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user }                            = useCurrentUser();
  const router                              = useRouter();

  /* Preferences stored locally (would persist to DB in future) */
  const [darkMode,      setDarkMode]        = useState(false);
  const [emailNotif,    setEmailNotif]      = useState(true);
  const [streakReminder,setStreakReminder]  = useState(true);
  const [weeklyReport,  setWeeklyReport]    = useState(false);

  /* Change password */
  const [pwForm,    setPwForm]    = useState({ current: "", next: "", confirm: "" });
  const [showPw,    setShowPw]    = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  /* Danger zone */
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isGoogleUser = !!(user as {authProvider?: string})?.authProvider === false ||
    (user as {authProvider?: string})?.authProvider === "google";

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error("New passwords do not match."); return; }
    if (pwForm.next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    setPwLoading(true);
    try {
      const res  = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      toast.success("Password updated successfully!");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch { toast.error("Network error."); }
    finally { setPwLoading(false); }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <DashboardLayout user={user}>
      <Toaster position="top-right"/>
      <div style={{ padding: 24, maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg,var(--charcoal),#3A3A3A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
            <Settings size={22} color="#fff"/>
          </div>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em",
              color: "var(--text-primary)" }}>Settings</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Manage your account, security, and preferences
            </p>
          </div>
        </div>

        {/* ── Account ──────────────────────────────────────────── */}
        <Section title="Account" icon={<User size={16}/>} accent="var(--ruby)">
          <Row label="Name" sub={user?.name ?? "—"}>
            <Link href="/profile" className="btn btn-sm btn-secondary" style={{ gap: 5 }}>
              Edit <ChevronRight size={13}/>
            </Link>
          </Row>
          <Row label="Email" sub={user?.email ?? "—"}/>
          <Row label="Member since"
            sub={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}/>
          <Row label="Auth Method"
            sub={(user as {authProvider?: string})?.authProvider === "google" ? "Google OAuth" : "Email & Password"}>
            {(user as {authProvider?: string})?.authProvider === "google" && (
              <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: 99,
                background: "rgba(66,133,244,0.1)", color: "#4285F4", fontWeight: 600 }}>
                Google
              </span>
            )}
          </Row>
        </Section>

        {/* ── Change Password ───────────────────────────────────── */}
        <Section title="Change Password" icon={<Lock size={16}/>} accent="#4895EF">
          {(user as {authProvider?: string})?.authProvider === "google" ? (
            <div style={{ padding: "14px 16px", background: "rgba(72,149,239,0.07)",
              borderRadius: 12, border: "1px solid rgba(72,149,239,0.2)" }}>
              <p style={{ fontSize: "0.875rem", color: "#4895EF" }}>
                Your account uses Google Sign-In. Password management is handled by Google.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {pwSuccess ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
                    background: "rgba(82,183,136,0.08)", borderRadius: 12, border: "1px solid rgba(82,183,136,0.2)" }}>
                  <CheckCircle size={18} color="#52B788"/>
                  <p style={{ fontSize: "0.875rem", color: "#52B788", fontWeight: 600 }}>
                    Password changed successfully!
                  </p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleChangePassword}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  <Field label="Current Password">
                    <div style={{ position: "relative" }}>
                      <input type={showPw ? "text" : "password"} {...INP}
                        value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                        placeholder="Your current password" required
                        style={{ ...INP.style, paddingRight: 44 }}/>
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                        {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="New Password">
                      <input type={showPw ? "text" : "password"} {...INP}
                        value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                        placeholder="Min. 8 characters" required/>
                    </Field>
                    <Field label="Confirm New Password">
                      <input type={showPw ? "text" : "password"} {...INP}
                        value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                        placeholder="Repeat new password" required
                        style={{ ...INP.style, borderColor: pwForm.confirm && pwForm.confirm !== pwForm.next ? "var(--ruby)" : undefined }}/>
                    </Field>
                  </div>

                  <motion.button type="submit" disabled={pwLoading}
                    whileHover={!pwLoading ? { scale: 1.01 } : {}} whileTap={!pwLoading ? { scale: 0.98 } : {}}
                    className="btn btn-primary" style={{ alignSelf: "flex-start", gap: 8 }}>
                    {pwLoading
                      ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                          animation: "spin 0.8s linear infinite" }}/> Updating…</>
                      : <><Lock size={14}/> Update Password</>
                    }
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </Section>

        {/* ── Notifications ────────────────────────────────────── */}
        <Section title="Notifications" icon={<Bell size={16}/>} accent="#D4A373">
          <Row label="Email Notifications" sub="Receive updates about your study progress">
            <Toggle value={emailNotif} onChange={setEmailNotif}/>
          </Row>
          <Row label="Streak Reminders" sub="Daily reminders to keep your streak alive">
            <Toggle value={streakReminder} onChange={setStreakReminder}/>
          </Row>
          <Row label="Weekly Report" sub="Summary of your weekly study performance">
            <Toggle value={weeklyReport} onChange={setWeeklyReport}/>
          </Row>
        </Section>

        {/* ── Preferences ──────────────────────────────────────── */}
        <Section title="Preferences" icon={<Clock size={16}/>} accent="#9B5DE5">
          <Row label="Appearance" sub="Visual theme for the dashboard">
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--warm-white)", cursor: "pointer" }}
              onClick={() => toast("Dark mode coming soon!", { icon: "🌙" })}>
              {darkMode ? <Moon size={14} color="#9B5DE5"/> : <Sun size={14} color="#D4A373"/>}
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {darkMode ? "Dark" : "Light"}
              </span>
            </div>
          </Row>
          <Row label="Profile Settings" sub="Edit name, college, department, and goals">
            <Link href="/profile" className="btn btn-sm btn-secondary" style={{ gap: 5 }}>
              Open <ChevronRight size={13}/>
            </Link>
          </Row>
          <Row label="AI Study Coach" sub="Generate personalised study plans">
            <Link href="/ai" className="btn btn-sm btn-secondary" style={{ gap: 5 }}>
              Open <ChevronRight size={13}/>
            </Link>
          </Row>
        </Section>

        {/* ── Security ─────────────────────────────────────────── */}
        <Section title="Security" icon={<Shield size={16}/>} accent="#52B788">
          <Row label="Active Session" sub="You are currently signed in on this device">
            <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: 99,
              background: "rgba(82,183,136,0.1)", color: "#52B788", fontWeight: 600 }}>
              Active
            </span>
          </Row>
          <Row label="Two-Factor Authentication" sub="Extra security layer — coming soon">
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Soon</span>
          </Row>
        </Section>

        {/* ── Danger Zone ──────────────────────────────────────── */}
        <div style={{ background: "rgba(230,57,70,0.04)", border: "1px solid rgba(230,57,70,0.2)",
          borderRadius: 20, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Trash2 size={16} color="var(--ruby)"/>
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--ruby)" }}>Danger Zone</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Sign Out */}
            {!confirmLogout ? (
              <Row label="Sign Out" sub="Sign out from your current session">
                <button onClick={() => setConfirmLogout(true)} className="btn btn-sm btn-secondary"
                  style={{ color: "var(--ruby)", borderColor: "rgba(230,57,70,0.3)" }}>
                  Sign Out
                </button>
              </Row>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: "12px 16px", background: "rgba(230,57,70,0.08)",
                  borderRadius: 12, border: "1px solid rgba(230,57,70,0.2)" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 10, fontWeight: 500 }}>
                  Are you sure you want to sign out?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleLogout} className="btn btn-sm btn-primary">
                    Yes, Sign Out
                  </button>
                  <button onClick={() => setConfirmLogout(false)} className="btn btn-sm btn-secondary">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            <Row label="Delete Account" sub="Permanently delete your account and all data">
              <button onClick={() => toast.error("Please contact support to delete your account.", { duration: 4000 })}
                className="btn btn-sm btn-secondary"
                style={{ color: "var(--ruby)", borderColor: "rgba(230,57,70,0.3)" }}>
                Delete Account
              </button>
            </Row>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
