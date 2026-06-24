// ── Motivational Quotes ───────────────────────────────────────
export const MOTIVATIONAL_QUOTES = [
  "Success is the sum of small efforts repeated daily.",
  "Learning never exhausts the mind.",
  "Stay consistent. Great things take time.",
  "The expert in anything was once a beginner.",
  "Your future self will thank you.",
  "Every session counts. Every minute matters.",
  "Consistency beats intensity every single time.",
  "Push yourself, because no one else is going to do it for you.",
  "Knowledge is the one thing no one can take from you.",
  "Study hard today; shine bright tomorrow.",
  "Small daily improvements are the key to staggering long-term results.",
  "Discipline is choosing between what you want now and what you want most.",
  "The more you learn, the more you earn.",
  "Don't watch the clock. Do what it does — keep going.",
  "Education is not the filling of a pail but the lighting of a fire.",
];

export const DAILY_AI_MESSAGES = [
  "Your future self will thank you for studying today.",
  "Every session you complete is a brick in your success.",
  "Consistency today is excellence tomorrow.",
  "You are exactly where you need to be. Keep going.",
  "One more session is one step closer to mastery.",
  "Champions are built in the quiet moments of study.",
  "The journey of a thousand miles begins with a single session.",
  "Your dedication is your superpower.",
];

// ── Badge / Achievement Definitions ──────────────────────────
export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  totalRubies: number;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first_session",
    name: "First Step",
    description: "Complete your very first study session.",
    icon: "🎯",
    color: "#4895EF",
    condition: (s) => s.totalSessions >= 1,
  },
  {
    id: "seven_day_warrior",
    name: "7-Day Warrior",
    description: "Maintain a 7-day study streak.",
    icon: "🔥",
    color: "#E63946",
    condition: (s) => s.currentStreak >= 7,
  },
  {
    id: "thirty_day_master",
    name: "30-Day Master",
    description: "Maintain a 30-day study streak.",
    icon: "👑",
    color: "#D4A373",
    condition: (s) => s.longestStreak >= 30,
  },
  {
    id: "hundred_hours",
    name: "100 Hours Club",
    description: "Study for a cumulative 100 hours.",
    icon: "⏰",
    color: "#52B788",
    condition: (s) => s.totalMinutes >= 6000,
  },
  {
    id: "ruby_collector",
    name: "Ruby Collector",
    description: "Earn 50 or more Rubies.",
    icon: "💎",
    color: "#E63946",
    condition: (s) => s.totalRubies >= 50,
  },
  {
    id: "consistency_champion",
    name: "Consistency Champion",
    description: "Complete 100 total study sessions.",
    icon: "🏆",
    color: "#D4A373",
    condition: (s) => s.totalSessions >= 100,
  },
  {
    id: "ten_sessions",
    name: "Getting Started",
    description: "Complete 10 study sessions.",
    icon: "📚",
    color: "#9B5DE5",
    condition: (s) => s.totalSessions >= 10,
  },
  {
    id: "fifty_sessions",
    name: "Halfway Hero",
    description: "Complete 50 study sessions.",
    icon: "⚡",
    color: "#F4A261",
    condition: (s) => s.totalSessions >= 50,
  },
  /* ── New v1.6 achievements ───────────────────────────────── */
  {
    id: "two_hundred_hours",
    name: "200 Hours Legend",
    description: "Study for a cumulative 200 hours.",
    icon: "🌟",
    color: "#E9C46A",
    condition: (s) => s.totalMinutes >= 12000,
  },
  {
    id: "ruby_master",
    name: "Ruby Master",
    description: "Earn 200 or more Rubies.",
    icon: "💍",
    color: "#E63946",
    condition: (s) => s.totalRubies >= 200,
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "Maintain a 14-day study streak.",
    icon: "🔱",
    color: "#4895EF",
    condition: (s) => s.longestStreak >= 14,
  },
  {
    id: "daily_goal_master",
    name: "Daily Goal Master",
    description: "Complete 200 total study sessions.",
    icon: "🎖",
    color: "#9B5DE5",
    condition: (s) => s.totalSessions >= 200,
  },
  {
    id: "top_performer",
    name: "Top Performer",
    description: "Earn 500 or more Rubies.",
    icon: "🥇",
    color: "#FFD700",
    condition: (s) => s.totalRubies >= 500,
  },
  {
    id: "dedication_500h",
    name: "Dedicated Scholar",
    description: "Study for a cumulative 500 hours.",
    icon: "📜",
    color: "#2A9D8F",
    condition: (s) => s.totalMinutes >= 30000,
  },
];

// ── Daily Challenge Templates ─────────────────────────────────
export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: "sessions" | "minutes";
  rubyReward: number;
}

export const CHALLENGE_POOL: ChallengeDef[] = [
  {
    id: "study_60",
    title: "Study 60 Minutes Today",
    description: "Complete at least 60 minutes of study in a single day.",
    target: 60,
    unit: "minutes",
    rubyReward: 5,
  },
  {
    id: "two_sessions",
    title: "Complete 2 Sessions Today",
    description: "Log at least 2 separate study sessions today.",
    target: 2,
    unit: "sessions",
    rubyReward: 3,
  },
  {
    id: "study_90",
    title: "Power Hour+",
    description: "Study for 90 minutes or more today.",
    target: 90,
    unit: "minutes",
    rubyReward: 8,
  },
  {
    id: "study_30",
    title: "Quick Sprint",
    description: "Complete at least 30 minutes of study today.",
    target: 30,
    unit: "minutes",
    rubyReward: 2,
  },
  {
    id: "three_sessions",
    title: "Triple Session Day",
    description: "Log 3 separate study sessions today.",
    target: 3,
    unit: "sessions",
    rubyReward: 10,
  },
];

// ── Ruby System ───────────────────────────────────────────────
export const RUBY_RULES = {
  perSession:        1,
  sevenDayStreak:   10,
  thirtyDayStreak:  50,
  hundredHours:    100,
} as const;

// ── Stat card meta ────────────────────────────────────────────
export const STAT_CARDS = [
  { key: "totalSessions", label: "Total Sessions", icon: "BookOpen",  accent: "card-ruby",   unit: "" },
  { key: "totalMinutes",  label: "Study Minutes",  icon: "Clock",     accent: "card-blue",   unit: "min" },
  { key: "currentStreak", label: "Current Streak", icon: "Flame",     accent: "card-ruby",   unit: "days" },
  { key: "longestStreak", label: "Best Streak",    icon: "Trophy",    accent: "card-gold",   unit: "days" },
  { key: "totalRubies",   label: "Rubies Earned",  icon: "Gem",       accent: "card-purple", unit: "" },
] as const;
