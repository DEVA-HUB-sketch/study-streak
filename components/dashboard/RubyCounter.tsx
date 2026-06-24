"use client";

import { motion, useSpring, useTransform, useMotionValue, animate } from "framer-motion";
import { useEffect } from "react";
import { Gem } from "lucide-react";

interface RubyCounterProps { count: number; }

export default function RubyCounter({ count }: RubyCounterProps) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionVal, count, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [count, motionVal]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-5 flex items-center gap-4 card-ruby"
    >
      {/* Animated gem */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center ruby-glow shrink-0"
        style={{ background: "linear-gradient(135deg, var(--ruby), var(--ruby-dark))" }}
      >
        <Gem size={26} className="text-white" />
      </motion.div>

      <div>
        <p className="text-xs font-medium mb-1" style={{ color: "var(--dark-soft)", opacity: 0.6 }}>
          Total Rubies Earned
        </p>
        <div className="flex items-baseline gap-1.5">
          <motion.span
            className="text-4xl font-black ruby-text-glow"
            style={{ color: "var(--ruby)" }}
          >
            {rounded}
          </motion.span>
          <Gem size={14} style={{ color: "var(--ruby)", opacity: 0.7 }} />
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--dark-soft)", opacity: 0.5 }}>
          1 session = 1 ruby · streak bonuses apply
        </p>
      </div>
    </motion.div>
  );
}
