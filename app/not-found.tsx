"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gem, SearchX, LayoutDashboard } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--warm-white)", padding: "24px",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 440, width: "100%", textAlign: "center" }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#E63946,#C1121F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gem size={17} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>Study Streak</span>
        </Link>

        {/* 404 number */}
        <div style={{ fontSize: "6rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.05em", marginBottom: 8,
          background: "linear-gradient(135deg,#E63946,#D4A373)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          404
        </div>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--cream)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <SearchX size={28} color="var(--text-tertiary)" />
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 10 }}>
          Page not found
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 32 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
            style={{ gap: 8 }}
          >
            <LayoutDashboard size={15} /> Go to Dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
