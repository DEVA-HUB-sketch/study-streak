"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

export default function WelcomeSection() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 mb-6 relative overflow-hidden"
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--ruby), transparent)" }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--gold), transparent)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: "var(--gold)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--gold)" }}>
            {greeting}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--dark)" }}>
          Welcome back,{" "}
          <span style={{ color: "var(--ruby)" }}>Future Achiever!</span>
        </h1>

        <p className="text-sm italic" style={{ color: "var(--dark-soft)", opacity: 0.7 }}>
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}
