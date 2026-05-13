import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────
  user: null,           // { uid, email, displayName, photoURL }
  isAuthenticated: false,
  authLoading: true,

  // ── Profile ───────────────────────────────────
  profile: null,        // { name, age, weight, goal, aiPersona, activityLevel, tier }

  // ── Current scan ──────────────────────────────
  currentScan: null,    // full analysis result + scanId

  // ── Scan history ──────────────────────────────
  scanHistory: [],

  // ── Daily stats ───────────────────────────────
  dailyStats: null,     // { totalCalories, totalProtein, totalCarbs, totalFats, nutritionScore }

  // ── Settings ──────────────────────────────────
  gymMode: false,

  // ── UI state ──────────────────────────────────
  isAnalyzing: false,   // true while scan is in progress

  // ── Actions ───────────────────────────────────

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    authLoading: false,
  }),

  setAuthLoading: (loading) => set({ authLoading: loading }),

  setProfile: (profile) => set({ profile }),

  setCurrentScan: (scan) => set({ currentScan: scan }),

  clearCurrentScan: () => set({ currentScan: null }),

  setScanHistory: (scans) => set({ scanHistory: scans }),

  addToHistory: (scan) => set((state) => ({
    scanHistory: [scan, ...state.scanHistory],
  })),

  removeScanFromHistory: (scanId) => set((state) => ({
    scanHistory: state.scanHistory.filter(s => s.id !== scanId),
  })),

  setDailyStats: (stats) => set({ dailyStats: stats }),

  toggleGymMode: () => set((state) => ({ gymMode: !state.gymMode })),

  setGymMode: (val) => set({ gymMode: val }),

  setIsAnalyzing: (val) => set({ isAnalyzing: val }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    profile: null,
    currentScan: null,
    scanHistory: [],
    dailyStats: null,
    gymMode: false,
  }),

  // Computed helpers
  getPersona: () => get().profile?.aiPersona || 'coach',
  getGoal:    () => get().profile?.goal || 'healthy_eating',
  isPremium:  () => get().profile?.tier === 'premium',
}));

export default useAppStore;
