"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bot, RefreshCw } from "lucide-react";
import { DAILY_AI_MESSAGES } from "@/lib/constants";

export default function MotivationCorner() {
  const message = useMemo(
    () => DAILY_AI_MESSAGES[Math.floor(Math.random() * DAILY_AI_MESSAGES.length)],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--sidebar) 0%, var(--sidebar-2) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(230,57,70,0.2), transparent)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(230,57,70,0.2)" }}
          >
            <Bot size={14} style={{ color: "var(--ruby)" }} />
          </div>
          <span className="text-xs font-semibold text-white/70">AI Motivation</span>
          <RefreshCw size={11} className="ml-auto text-white/25" />
        </div>

        <p className="text-white font-medium text-sm leading-relaxed">
          &ldquo;{message}&rdquo;
        </p>

        <p className="text-white/30 text-xs mt-3">— Your AI Study Companion</p>
      </div>
    </motion.div>
  );
}
