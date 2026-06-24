"use client";

import { motion } from "framer-motion";

/**
 * Placeholder 3D Study Robot.
 * Replace with a real @react-three/fiber scene once you have a GLTF model.
 * Folder for models: public/models/study-robot.glb
 */
export default function StudyRobot() {
  return (
    <div className="flex flex-col items-center justify-center h-44">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Robot head */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--sidebar), #0F3460)" }}
        >
          🤖
        </div>
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "0 0 30px rgba(230,57,70,0.4)", opacity: 0.6 }}
        />
      </motion.div>
      <p className="text-xs mt-3" style={{ color: "var(--dark-soft)", opacity: 0.45 }}>
        AI Study Robot
      </p>
    </div>
  );
}
