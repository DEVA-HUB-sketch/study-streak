import { RUBY_RULES } from "./constants";

export function computeRubies(
  totalSessions: number,
  currentStreak: number,
  longestStreak: number,
  totalMinutes: number
): number {
  let rubies = totalSessions * RUBY_RULES.perSession;

  // Streak milestones (award once per milestone achieved historically)
  if (longestStreak >= 7)  rubies += RUBY_RULES.sevenDayStreak;
  if (longestStreak >= 30) rubies += RUBY_RULES.thirtyDayStreak;

  // 100 hours milestone
  if (totalMinutes >= 6000) rubies += RUBY_RULES.hundredHours;

  return rubies;
}
