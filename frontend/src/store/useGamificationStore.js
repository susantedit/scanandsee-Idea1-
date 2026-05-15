import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Gamification store — tracks streaks, XP, badges.
 * Persisted to localStorage to survive page reloads.
 */
const useGamificationStore = create(
  persist(
    (set, get) => ({
      // Streaks
      scanStreak: 0,
      lastScanDate: null,
      longestScanStreak: 0,

      // XP & Level
      xp: 0,
      level: 1,

      // Badges
      badges: [],

      // Increment scan streak (call after successful scan)
      recordScan: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastScanDate, scanStreak, longestScanStreak } = get();
        
        let newStreak = scanStreak;
        
        // If last scan was today, streak continues
        if (lastScanDate === today) return;
        
        // If last scan was yesterday, increment streak
        const lastDate = lastScanDate ? new Date(lastScanDate) : null;
        const todayDate = new Date(today);
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate && lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          newStreak = scanStreak + 1;
        } else if (!lastScanDate) {
          newStreak = 1;
        } else {
          newStreak = 1; // streak broken
        }

        const newLongest = Math.max(newStreak, longestScanStreak);
        
        set({
          scanStreak: newStreak,
          lastScanDate: today,
          longestScanStreak: newLongest,
          xp: get().xp + 50, // 50 XP per scan
        });

        // Check for badge unlocks
        get().checkBadges();
      },

      // Unlock badge
      unlockBadge: (badgeId) => {
        const { badges } = get();
        if (!badges.includes(badgeId)) {
          set({ badges: [...badges, badgeId] });
        }
      },

      // Check and auto-unlock badges
      checkBadges: () => {
        const { scanStreak, xp, badges } = get();
        
        const badgeRules = [
          { id: 'first_scan', condition: () => scanStreak >= 1 },
          { id: 'week_streak', condition: () => scanStreak >= 7 },
          { id: 'month_streak', condition: () => scanStreak >= 30 },
          { id: 'xp_100', condition: () => xp >= 100 },
          { id: 'xp_500', condition: () => xp >= 500 },
          { id: 'xp_1000', condition: () => xp >= 1000 },
        ];

        badgeRules.forEach(({ id, condition }) => {
          if (condition() && !badges.includes(id)) {
            get().unlockBadge(id);
          }
        });
      },

      // Get current level based on XP
      getLevel: () => {
        const { xp } = get();
        return Math.floor(xp / 500) + 1;
      },

      // Reset (for testing)
      reset: () => {
        set({
          scanStreak: 0,
          lastScanDate: null,
          longestScanStreak: 0,
          xp: 0,
          level: 1,
          badges: [],
        });
      },
    }),
    {
      name: 'gamification-store',
      version: 1,
    }
  )
);

export default useGamificationStore;
