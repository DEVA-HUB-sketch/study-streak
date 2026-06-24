"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AchievementGrid from "@/components/achievements/AchievementGrid";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AchievementsPage() {
  const { user }                              = useCurrentUser();
  const [unlockedIds, setUnlocked]            = useState<string[]>([]);
  const [totalRubies, setTotalRubies]         = useState(0);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => {
      if (d?.unlockedBadgeIds) setUnlocked(d.unlockedBadgeIds);
      if (d?.totalRubies)      setTotalRubies(d.totalRubies);
    });
  }, []);

  return (
    <DashboardLayout user={user} totalRubies={totalRubies}>
      <div className="p-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Medal size={22} style={{ color: "var(--gold)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--dark)" }}>Achievements</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--dark-soft)", opacity: 0.55 }}>
            Unlock badges by hitting study milestones. Every session counts.
          </p>
        </motion.div>
        <AchievementGrid unlockedIds={unlockedIds} />
      </div>
    </DashboardLayout>
  );
}
