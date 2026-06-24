"use client";

import { motion } from "framer-motion";
import { Gem } from "lucide-react";

/**
 * Placeholder Ruby Crystal animation.
 * Replace with a real @react-three/fiber crystal mesh once Three.js is installed.
 * Folder for models: public/models/ruby-crystal.glb
 */
export default function RubyCrystal() {
  return (
    <div className="flex flex-col items-center justify-center h-36">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center ruby-glow"
        style={{ background: "linear-gradient(135deg, var(--ruby), var(--ruby-dark))" }}
      >
        <Gem size={28} className="text-white" />
      </motion.div>
      <p className="text-xs mt-3 font-medium" style={{ color: "var(--ruby)" }}>
        Ruby Crystal
      </p>
    </div>
  );
}
