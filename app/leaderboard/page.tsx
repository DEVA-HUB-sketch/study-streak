"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface LeaderboardEntry {
  rank: number; username: string; hoursStudied: number;
  totalSessions: number; totalRubies: number; streak: number; isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rubies,  setRubies]  = useState(0);

  useEffect(() => {
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setEntries(d); });
    fetch("/api/stats").then((r) => r.json()).then((d) => { if (d?.totalRubies) setRubies(d.totalRubies); });
  }, []);

  return (
    <DashboardLayout totalRubies={rubies}>
      <div className="p-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Trophy size={22} style={{ color: "var(--gold)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--dark)" }}>Leaderboard</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--dark-soft)", opacity: 0.55 }}>
            Compete globally. Earn rubies. Dominate the ranks.
          </p>
        </motion.div>
        <LeaderboardTable entries={entries} />
      </div>
    </DashboardLayout>
  );
}
