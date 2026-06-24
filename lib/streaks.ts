import { startOfDay, differenceInCalendarDays, parseISO, format } from "date-fns";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  studiedDates: string[]; // "YYYY-MM-DD"
  weekGrid: boolean[];    // last 7 days, index 0 = 6 days ago, index 6 = today
}

export function computeStreaks(sessionDates: (Date | string)[]): StreakResult {
  if (sessionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, studiedDates: [], weekGrid: Array(7).fill(false) };
  }

  // Normalise to unique YYYY-MM-DD strings
  const uniqueDays = Array.from(
    new Set(
      sessionDates.map((d) =>
        format(startOfDay(typeof d === "string" ? parseISO(d) : d), "yyyy-MM-dd")
      )
    )
  ).sort(); // ascending

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  // ── Current streak ──────────────────────────────────────────
  let currentStreak = 0;
  let checkDay = today;

  while (true) {
    if (uniqueDays.includes(checkDay)) {
      currentStreak++;
      const prev = new Date(checkDay);
      prev.setDate(prev.getDate() - 1);
      checkDay = format(prev, "yyyy-MM-dd");
    } else {
      // Allow a single missed day so streak survives if user hasn't studied today yet
      if (checkDay === today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        checkDay = format(yesterday, "yyyy-MM-dd");
        if (!uniqueDays.includes(checkDay)) break;
        currentStreak++;
        const prev = new Date(checkDay);
        prev.setDate(prev.getDate() - 1);
        checkDay = format(prev, "yyyy-MM-dd");
      } else {
        break;
      }
    }
  }

  // ── Longest streak ──────────────────────────────────────────
  let longestStreak = 0;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(uniqueDays[i]),
      parseISO(uniqueDays[i - 1])
    );
    if (diff === 1) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      if (run > longestStreak) longestStreak = run;
      run = 1;
    }
  }
  if (run > longestStreak) longestStreak = run;

  // ── Week grid (last 7 days) ─────────────────────────────────
  const weekGrid: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekGrid.push(uniqueDays.includes(format(d, "yyyy-MM-dd")));
  }

  return { currentStreak, longestStreak, studiedDates: uniqueDays, weekGrid };
}
