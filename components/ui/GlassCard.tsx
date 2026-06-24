"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  accent?: "ruby" | "gold" | "green" | "blue" | "purple" | "none";
  hover?: boolean;
  className?: string;
}

const accentClass: Record<string, string> = {
  ruby:   "card-ruby",
  gold:   "card-gold",
  green:  "card-green",
  blue:   "card-blue",
  purple: "card-purple",
  none:   "",
};

export default function GlassCard({
  children,
  accent = "none",
  hover = true,
  className,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, boxShadow: "0 12px 40px rgba(45,45,45,0.18)" } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("glass rounded-2xl p-5", accentClass[accent], className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
