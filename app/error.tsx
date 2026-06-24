"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Gem, AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

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

        {/* Icon */}
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <AlertTriangle size={32} color="var(--ruby)" />
        </div>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 10 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 32 }}>
          An unexpected error occurred. Your data is safe — this is likely a temporary glitch.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="btn btn-primary"
            style={{ gap: 8 }}
          >
            <RefreshCcw size={15} /> Try again
          </motion.button>
          <Link href="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        {error.digest && (
          <p style={{ marginTop: 24, fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
