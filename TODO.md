# ScanAndSee — TODO List
> Pick up from here when you're back. Do in order — each step builds on the last.

---

## PRIORITY 1 — Fix & Polish (do first, app is broken without these)

- [x] **Fix scan 500 error** — Gemini API is rate-limited (429). The `GEMINI_API_KEY` free tier is 15 RPM. Either wait or get a new key at aistudio.google.com/apikey
- [x] **Test full scan flow** — upload a food photo, verify results page loads with score + macros + voice
- [x] **Test sign-in → profile save → home dashboard** — confirm Firestore writes work end to end
- [x] **Fix `npm run dev` (Vite dev mode)** — currently only `npm start` (build+preview) works. Root cause: Firebase 10 + Vite 5 dev optimizer conflict. Solution: downgrade firebase to `9.23.0` in frontend/package.json OR keep using `npm start`check 

---

## PRIORITY 2 — Missing Core Features (high impact, build next)

- [x] **Scan Confidence Display** — add `confidence_pct` field to Gemini prompt, show "92% confident" badge on results page
- [x] **Richer Overlay Badges** — update `ScanOverlay.jsx` to show "Protein High 🟢", "Sugar Warning 🔴", "Good for Bulking 💪" badges from live result
- [x] **Countdown animation in overlay** — 3-2-1 countdown before capture triggers analysis
- [x] **Toast system** — create `frontend/src/components/ui/Toast.jsx` with brand colors (green=success, red=error, cyan=info) + icons from Lucide ✅ (+ system notifications)
- [x] **`/api/classify/quick` wired to live camera** — `classify.routes.js` is built on backend, but `CameraView.jsx` still calls full `analyzeScan`. Switch live frames to `classifyQuick()` from `api.js`

---

## PRIORITY 3 — AI Memory & Personalization

- [x] **AI Memory store** — create `frontend/src/store/useMemoryStore.js` using Zustand + localStorage persistence
  - stores: favorite foods, allergens, scan patterns, sugar/sodium trends
  - exposes: `getPersonalizedContext()` for injecting into chat prompts
- [x] **Personalized chat context** — update `ChatPage.jsx` to pass memory context with every `askAI()` call
- [x] **Backend memory endpoint** — `POST /api/user/memory` saves preferences to Firestore, `GET /api/user/memory` retrieves them
- [x] **Proactive AI warnings** — after 3 scans with high sugar, show banner: "You've exceeded sugar intake 3 days in a row"

---

## PRIORITY 4 — Gamification (retention engine)

- [x] **Gamification store** — create `frontend/src/store/useGamificationStore.js`
  - XP system: +10 XP per scan, +25 XP for healthy food, +5 XP for sharing
  - Levels: 1-10 based on XP thresholds
  - Streaks: consecutive days with at least 1 scan
  - Badges: "Protein King", "Sugar Slayer", "7-Day Streak", "First Scan"
- [x] **XP/Level display** — add XP bar + level badge to `ProfilePage.jsx` and `Navbar.jsx`
- [x] **Achievement notifications** — toast when user earns a badge
- [x] **Streak display** — show current streak on `HomePage.jsx` hero section

---

## PRIORITY 5 — Analytics Dashboard

- [x] **Backend analytics endpoint** — `GET /api/analytics/dashboard`
  - returns: total scans today/week/month, avg health score, top scanned foods, 429 rate, active users
  - reads from Firestore aggregates
- [x] **Analytics page** — create `frontend/src/pages/AnalyticsPage.jsx`
  - scan volume chart (custom SVG bars, 7-day)
  - avg health score trend
  - most scanned food categories
  - rate limit hit counter
- [x] **Wire Firebase Analytics** — add `logEvent()` calls in `ScanPage.jsx`, `ResultsPage.jsx`, `SetupPage.jsx`

---

## PRIORITY 6 — Meal Generator

- [x] **Backend prompt** — create `backend/prompts/mealgen.prompt.js`
  - input: protein target (g), budget (currency + amount), goal, dietary restrictions
  - output: full meal plan with ingredients, macros, cost estimate, prep time
- [x] **Backend route** — `POST /api/meal/generate`
- [x] **Frontend page** — create `frontend/src/pages/MealGeneratorPage.jsx`
  - inputs: "I want Xg protein under Rs. Y"
  - output: AI-generated meal plan cards
- [x] **Add to HomePage** More Tools grid and App.jsx router

---

## PRIORITY 7 — Social Virality

- [x] **Scan battles** — two users compare health scores on same food
- [x] **Weekly rankings** — leaderboard resets every Monday, shows top 10
- [x] **Challenge system** — "7-day no sugar challenge", "Protein week"
- [x] **AI Roast Cards** — shareable image with savage AI commentary on your food choice
- [x] **Friend streaks** — see friends' scan streaks (requires friend system)

---

## PRIORITY 8 — Advanced Scan Visualization

- [x] **Ingredient detection boxes** — draw bounding boxes on food image for detected ingredients
- [x] **Nutrition radar chart** — hexagonal radar showing protein/carbs/fats/sugar/sodium/fiber balance
- [x] **Body impact visualization** — simple diagram showing which organs are affected by warnings
- [x] **Confidence meter** — animated bar showing AI certainty %

---

## PRIORITY 9 — Offline Mode

- [x] **Cache last 10 scans** in service worker for offline viewing
- [x] **Offline indicator** — show banner when no internet
- [x] **Lightweight AI fallback** — when offline, show cached nutrition data for common foods from a local JSON file

---

## PRIORITY 10 — Premium Features (monetization)

- [x] **Stripe integration** — payment for premium tier
- [x] **Premium gate UI** — show upgrade prompt when free limits hit
- [x] **PDF report export** — weekly nutrition summary as downloadable PDF
- [x] **Advanced voice packs** — more Murf AI voices for premium users
- [x] **Unlimited scans** — remove rate limits for premium tier

---

## KNOWN BUGS TO FIX

| Bug | Where | Fix |
|---|---|---|
| Scan 500 error | `/api/scan/analyze` | Gemini rate limit — wait or new API key |
| `npm run dev` crashes | Frontend | Firebase 10 + Vite 5 conflict — use `npm start` for now |
| `Cross-Origin-Opener-Policy` warnings | Browser console | Harmless — Google popup warning, can't fix without removing COOP header |
| Voice doesn't play on iOS | ResultsPage | iOS requires user gesture to start audio — add manual play button |
| Scan history images don't show | HistoryPage | Base64 thumbnails may be too large for Firestore 1MB doc limit |

---

## WHEN YOU'RE BACK — START HERE

```
1. Run backend:   cd D:\scanandsee\backend  →  npm run dev
2. Run frontend:  cd D:\scanandsee\frontend →  npm start
3. Open browser:  http://localhost:5173
4. Test scan flow: upload a food photo → verify results load
5. If scan still 500: check Gemini quota at aistudio.google.com
6. Then start Priority 2 items above
```

---

## QUICK COMMANDS

```bash
# Start backend
cd D:\scanandsee\backend && npm run dev

# Start frontend (build + preview)
cd D:\scanandsee\frontend && npm start

# Check backend health
curl http://localhost:3001/api/health

# View backend logs
Get-Content D:\scanandsee\backend\logs\combined.log -Tail 50
```
