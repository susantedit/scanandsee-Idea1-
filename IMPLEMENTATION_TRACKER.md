# ScanAndSee — Master Implementation Tracker
> Read this file to know exactly where to resume. Each task has a status: [ ] = not started, [~] = in progress, [x] = done.
> Structure: frontend/ (React+Vite) + backend/ (Express Node.js)

---

## PROJECT STRUCTURE (Target)

```
D:\scanandsee\
├── frontend/                    ← React + Vite app
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── styles/
│       │   ├── variables.css
│       │   ├── typography.css
│       │   ├── animations.css
│       │   ├── components.css
│       │   └── utilities.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── BottomNav.jsx
│       │   │   └── GlassCard.jsx
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Chip.jsx
│       │   │   ├── ProgressRing.jsx
│       │   │   ├── MacroCard.jsx
│       │   │   ├── ScanInput.jsx
│       │   │   ├── VoiceWaveform.jsx
│       │   │   ├── ParticleBurst.jsx
│       │   │   └── DangerAlert.jsx
│       │   ├── scan/
│       │   │   ├── CameraView.jsx
│       │   │   ├── ScanOverlay.jsx
│       │   │   └── UploadZone.jsx
│       │   ├── results/
│       │   │   ├── HealthScoreHero.jsx
│       │   │   ├── MacroBreakdown.jsx
│       │   │   ├── IngredientList.jsx
│       │   │   ├── MealImprovement.jsx
│       │   │   ├── FitnessAssessment.jsx
│       │   │   └── ShareCard.jsx
│       │   ├── comparison/
│       │   │   ├── ComparisonView.jsx
│       │   │   └── ComparisonTable.jsx
│       │   └── chat/
│       │       ├── ChatInterface.jsx
│       │       └── SuggestedChips.jsx
│       ├── pages/
│       │   ├── SplashPage.jsx
│       │   ├── OnboardingPage.jsx
│       │   ├── SetupPage.jsx
│       │   ├── HomePage.jsx
│       │   ├── ScanPage.jsx
│       │   ├── ResultsPage.jsx
│       │   ├── ComparisonPage.jsx
│       │   ├── HistoryPage.jsx
│       │   ├── ChatPage.jsx
│       │   └── ProfilePage.jsx
│       ├── hooks/
│       │   ├── useCamera.js
│       │   ├── useVoice.js
│       │   ├── useSpeechRecognition.js
│       │   └── useAnimateValue.js
│       ├── services/
│       │   └── api.js              ← all backend fetch calls
│       ├── store/
│       │   └── useAppStore.js
│       └── utils/
│           ├── scoreColor.js
│           └── formatNutrition.js
│
└── backend/                     ← Express Node.js server
    ├── package.json
    ├── .env.example
    ├── index.js
    ├── config/
    │   ├── firebase.js
    │   ├── gemini.js
    │   └── constants.js
    ├── middleware/
    │   ├── auth.js
    │   ├── rateLimiter.js
    │   ├── upload.js
    │   ├── validate.js
    │   └── errorHandler.js
    ├── routes/
    │   ├── scan.routes.js
    │   ├── nutrition.routes.js
    │   ├── voice.routes.js
    │   ├── user.routes.js
    │   ├── compare.routes.js
    │   ├── chat.routes.js
    │   └── barcode.routes.js
    ├── services/
    │   ├── gemini.service.js
    │   ├── nutrition.service.js
    │   ├── voice.service.js
    │   ├── firebase.service.js
    │   ├── image.service.js
    │   ├── score.service.js
    │   └── cache.service.js
    ├── prompts/
    │   ├── analyze.prompt.js
    │   ├── compare.prompt.js
    │   ├── chat.prompt.js
    │   └── voice.prompt.js
    ├── schemas/
    │   ├── scan.schema.js
    │   ├── user.schema.js
    │   ├── compare.schema.js
    │   └── chat.schema.js
    └── utils/
        ├── logger.js
        ├── apiError.js
        └── helpers.js
```

---

## PHASE 1 — BACKEND FOUNDATION
> Goal: Running Express server with auth, upload, error handling

### STEP 1.1 — Backend package.json + index.js
- [ ] `backend/package.json` — dependencies: express, cors, dotenv, morgan, winston, multer, sharp, firebase-admin, @google/generative-ai, express-rate-limit, node-cache, zod, helmet
- [ ] `backend/.env.example` — all env vars documented
- [ ] `backend/index.js` — Express app entry point, all routes mounted, CORS, global middleware

### STEP 1.2 — Config files
- [ ] `backend/config/firebase.js` — Firebase Admin SDK init with env vars
- [ ] `backend/config/gemini.js` — Gemini client init
- [ ] `backend/config/constants.js` — FREE_SCAN_LIMIT=5, PREMIUM_SCAN_LIMIT=50, rate limit windows

### STEP 1.3 — Utilities
- [ ] `backend/utils/apiError.js` — ApiError class (statusCode, message, details)
- [ ] `backend/utils/logger.js` — Winston logger (console + file)
- [ ] `backend/utils/helpers.js` — shared helpers (generateId, formatDate, etc.)

### STEP 1.4 — Middleware
- [ ] `backend/middleware/auth.js` — Firebase ID token verification
- [ ] `backend/middleware/rateLimiter.js` — globalLimiter, scanLimiter, voiceLimiter
- [ ] `backend/middleware/upload.js` — multer memoryStorage, 10MB limit, image types only
- [ ] `backend/middleware/validate.js` — Zod schema validation wrapper
- [ ] `backend/middleware/errorHandler.js` — global error handler

### STEP 1.5 — Health check route
- [ ] `GET /api/health` returns `{ status: 'ok', timestamp }` — no auth needed

---

## PHASE 2 — BACKEND SERVICES + PROMPTS
> Goal: All business logic services implemented

### STEP 2.1 — Prompts
- [ ] `backend/prompts/analyze.prompt.js` — buildAnalysisPrompt(options) with gymMode + personality + goal
- [ ] `backend/prompts/compare.prompt.js` — COMPARE_PROMPT constant
- [ ] `backend/prompts/chat.prompt.js` — buildChatPrompt(question, scanContext)
- [ ] `backend/prompts/voice.prompt.js` — buildVoicePrompt(analysis, personality)

### STEP 2.2 — Zod Schemas
- [ ] `backend/schemas/scan.schema.js` — AnalysisSchema, IngredientSchema, WarningSchema
- [ ] `backend/schemas/user.schema.js` — ProfileSchema, GoalEnum, PersonaEnum
- [ ] `backend/schemas/compare.schema.js` — ComparisonSchema
- [ ] `backend/schemas/chat.schema.js` — ChatMessageSchema

### STEP 2.3 — Core Services
- [ ] `backend/services/cache.service.js` — node-cache wrapper (get, set, del, flush)
- [ ] `backend/services/image.service.js` — sharp resize to 1024px, JPEG 80%, strip EXIF, upload to Firebase Storage
- [ ] `backend/services/score.service.js` — calculateHealthScore() algorithm (base 5, modifiers ±0.5/1.0, clamp 0-10)
- [ ] `backend/services/firebase.service.js` — Firestore CRUD: saveScan, getScan, getHistory, saveProfile, getProfile, updateDailyLog
- [ ] `backend/services/gemini.service.js` — analyzeFood(), compareProducts(), chatAboutFood() with retry logic (3x exponential backoff)
- [ ] `backend/services/nutrition.service.js` — searchUSDA(), lookupBarcode(), enrichAnalysis()
- [ ] `backend/services/voice.service.js` — generateVoice() free=text, premium=ElevenLabs

---

## PHASE 3 — BACKEND ROUTES
> Goal: All API endpoints working, testable with curl

### STEP 3.1 — Scan Routes
- [ ] `backend/routes/scan.routes.js`
  - [ ] `POST /api/scan/analyze` — upload → compress → Gemini → score → save → respond
  - [ ] `GET /api/scan/history` — paginated list (?limit=20&offset=0)
  - [ ] `GET /api/scan/:scanId` — single scan
  - [ ] `DELETE /api/scan/:scanId` — delete scan

### STEP 3.2 — User Routes
- [ ] `backend/routes/user.routes.js`
  - [ ] `POST /api/user/profile` — create/update profile
  - [ ] `GET /api/user/profile` — get profile
  - [ ] `GET /api/user/stats` — totalScans, avgScore, streak, memberSince

### STEP 3.3 — Nutrition Routes
- [ ] `backend/routes/nutrition.routes.js`
  - [ ] `GET /api/nutrition/search?query=` — USDA search
  - [ ] `GET /api/nutrition/daily` — today's totals from dailyLog
  - [ ] `GET /api/nutrition/weekly` — 7-day array

### STEP 3.4 — Voice Routes
- [ ] `backend/routes/voice.routes.js`
  - [ ] `POST /api/voice/generate` — { text, personality, premium }
  - [ ] `GET /api/voice/personalities` — list of available voices

### STEP 3.5 — Compare Routes
- [ ] `backend/routes/compare.routes.js`
  - [ ] `POST /api/compare/products` — two images → comparison JSON

### STEP 3.6 — Chat Routes
- [ ] `backend/routes/chat.routes.js`
  - [ ] `POST /api/chat/ask` — { question, scanId? } → { answer, suggestions[] }

### STEP 3.7 — Barcode Routes
- [ ] `backend/routes/barcode.routes.js`
  - [ ] `GET /api/barcode/:code` — Open Food Facts lookup + cache

---

## PHASE 4 — FRONTEND FOUNDATION
> Goal: Vite+React running with full design system

### STEP 4.1 — Project setup files
- [ ] `frontend/index.html` — Google Fonts (Sora, Hanken Grotesk, Space Mono), meta tags
- [ ] `frontend/package.json` — react, react-dom, react-router-dom, zustand, lucide-react, framer-motion, firebase
- [ ] `frontend/vite.config.js` — port 5173, proxy /api → localhost:3001
- [ ] `frontend/.env.example` — VITE_API_URL, VITE_FIREBASE_* vars

### STEP 4.2 — CSS Design System (Cyber-Vitality)
- [ ] `frontend/src/styles/variables.css` — ALL CSS custom properties (colors, fonts, spacing, radius, glass, glows, z-index, transitions)
- [ ] `frontend/src/styles/typography.css` — .text-display, .text-headline, .text-body, .text-label classes
- [ ] `frontend/src/styles/animations.css` — ALL @keyframes: fadeUp, scanBeam, pulseRing, blink, shimmer, waveform bars, glowPulse, dangerPulse, particleOut, bracketSnap, typingDot, meshDrift
- [ ] `frontend/src/styles/components.css` — .btn-primary, .btn-outline, .glass-card, .chip variants, .scan-input, .progress-ring, .bottom-nav
- [ ] `frontend/src/styles/utilities.css` — .glass, .glow-primary, .glow-secondary, .glow-error, .holo-grid, layout helpers
- [ ] `frontend/src/index.css` — global reset, imports all above, body background, scrollbar styling

### STEP 4.3 — Entry point + Router
- [ ] `frontend/src/main.jsx` — ReactDOM.createRoot, BrowserRouter
- [ ] `frontend/src/App.jsx` — all routes defined: /, /onboarding, /setup, /home, /scan, /results, /compare, /history, /chat, /profile

---

## PHASE 5 — FRONTEND STATE + SERVICES
> Goal: Zustand store + API service layer wired up

### STEP 5.1 — Zustand Store
- [ ] `frontend/src/store/useAppStore.js`
  - user: { uid, email, profile, isAuthenticated }
  - currentScan: null | ScanResult
  - scanHistory: []
  - dailyStats: { calories, protein, carbs, fats, score }
  - gymMode: false
  - actions: setUser, setCurrentScan, addToHistory, setDailyStats, toggleGymMode, logout

### STEP 5.2 — API Service
- [ ] `frontend/src/services/api.js` — all fetch calls to backend:
  - analyzeScan(imageFile, gymMode)
  - getScanHistory(limit, offset)
  - getScan(scanId)
  - deleteScan(scanId)
  - getProfile() / saveProfile(data)
  - getUserStats()
  - getDailyNutrition()
  - getWeeklyNutrition()
  - generateVoice(text, personality)
  - compareProducts(imageA, imageB)
  - askAI(question, scanId)
  - lookupBarcode(code)
  - searchNutrition(query)

### STEP 5.3 — Firebase Auth (frontend)
- [ ] `frontend/src/services/firebase.js` — initializeApp, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, getIdToken

### STEP 5.4 — Custom Hooks
- [ ] `frontend/src/hooks/useCamera.js` — getUserMedia, capture photo, return base64
- [ ] `frontend/src/hooks/useVoice.js` — Web Speech API TTS, play/pause/stop, personality pitch/rate
- [ ] `frontend/src/hooks/useSpeechRecognition.js` — Web Speech Recognition, transcript state
- [ ] `frontend/src/hooks/useAnimateValue.js` — animate number from 0 to target over duration

### STEP 5.5 — Utils
- [ ] `frontend/src/utils/scoreColor.js` — score → { color, label, glow } (0-3=red, 4-6=yellow, 7-10=green)
- [ ] `frontend/src/utils/formatNutrition.js` — formatGrams, formatCalories, formatPercent, timeAgo

---

## PHASE 6 — REUSABLE UI COMPONENTS
> Goal: All shared components built and styled

### STEP 6.1 — Layout Components
- [ ] `frontend/src/components/layout/GlassCard.jsx` — glass-card wrapper, accepts className, children, onClick
- [ ] `frontend/src/components/layout/Navbar.jsx` — logo left, avatar right, settings icon, back button support
- [ ] `frontend/src/components/layout/BottomNav.jsx` — 5 items: Home, Scan (center enlarged), History, Compare, Profile with Lucide icons

### STEP 6.2 — UI Primitives
- [ ] `frontend/src/components/ui/Button.jsx` — variant: primary (clipped), outline, ghost. size: sm, md, lg. loading state with spinner
- [ ] `frontend/src/components/ui/Chip.jsx` — variant: healthy, warning, danger, protein, cyan, default. icon support
- [ ] `frontend/src/components/ui/ProgressRing.jsx` — SVG ring, animated stroke-dashoffset, score number inside, color by score
- [ ] `frontend/src/components/ui/MacroCard.jsx` — icon + value + unit + label + mini progress bar, color by macro type
- [ ] `frontend/src/components/ui/ScanInput.jsx` — underline input, cyan focus glow, label, scanning blink indicator
- [ ] `frontend/src/components/ui/VoiceWaveform.jsx` — 8 bars, wave animations when playing, flat when paused
- [ ] `frontend/src/components/ui/ParticleBurst.jsx` — 12 particles scatter radially on trigger, green + cyan colors
- [ ] `frontend/src/components/ui/DangerAlert.jsx` — red border glass card, AlertTriangle icon, risk type chip, warning text

### STEP 6.3 — Scan Components
- [ ] `frontend/src/components/scan/ScanOverlay.jsx` — corner brackets (animated), scan beam sweep, grid overlay, ANALYZING text
- [ ] `frontend/src/components/scan/CameraView.jsx` — webcam feed, ScanOverlay on top, capture button, flash toggle
- [ ] `frontend/src/components/scan/UploadZone.jsx` — drag & drop area, dashed cyan border, file picker, preview thumbnail

### STEP 6.4 — Results Components
- [ ] `frontend/src/components/results/HealthScoreHero.jsx` — large ProgressRing, verdict badge, food name, animated entry
- [ ] `frontend/src/components/results/MacroBreakdown.jsx` — 4 MacroCards in row: Protein, Carbs, Fats, Calories
- [ ] `frontend/src/components/results/IngredientList.jsx` — list with colored left-border, expandable rows, safety chips
- [ ] `frontend/src/components/results/MealImprovement.jsx` — glass card, green check icons, improvement suggestions list
- [ ] `frontend/src/components/results/FitnessAssessment.jsx` — bulking/cutting/pre/post workout badges, protein quality bar, recovery bar
- [ ] `frontend/src/components/results/ShareCard.jsx` — canvas-based card generator, download button

### STEP 6.5 — Comparison Components
- [ ] `frontend/src/components/comparison/ComparisonView.jsx` — two-panel layout, each with image + score + macros
- [ ] `frontend/src/components/comparison/ComparisonTable.jsx` — metric rows, green/red winner highlighting, trophy banner

### STEP 6.6 — Chat Components
- [ ] `frontend/src/components/chat/ChatInterface.jsx` — message list, input bar, typing indicator, voice input button
- [ ] `frontend/src/components/chat/SuggestedChips.jsx` — preset question chips, horizontal scroll

---

## PHASE 7 — PAGES
> Goal: All 10 screens fully built and routed

### STEP 7.1 — Splash Page
- [ ] `frontend/src/pages/SplashPage.jsx`
  - Full screen void background (#050505)
  - "ScanAndSee" logo with glow animation
  - Floating particles (green + cyan, CSS animation)
  - Holographic loading bar
  - Auto-navigate to /onboarding (first time) or /home (returning) after 2.5s

### STEP 7.2 — Onboarding Page
- [ ] `frontend/src/pages/OnboardingPage.jsx`
  - 3 slides with swipe/arrow navigation
  - Slide 1: ScanLine icon + scan beam animation + "Scan Any Food"
  - Slide 2: ProgressRing filling up + "Instant AI Analysis"
  - Slide 3: VoiceWaveform + "Your AI Nutrition Coach"
  - Pagination dots, Skip button, Get Started button
  - Saves "onboarded=true" to localStorage

### STEP 7.3 — Setup Page
- [ ] `frontend/src/pages/SetupPage.jsx`
  - Goal selector grid (7 options with Lucide icons, glass cards, green selected state)
  - AI Persona selector (4 chips: Doctor, Gym Bro, Coach, Savage Roast)
  - Profile inputs: Age, Weight, Activity Level (ScanInput style)
  - Continue button → saves to store + calls POST /api/user/profile → navigates /home

### STEP 7.4 — Home Page (Dashboard)
- [ ] `frontend/src/pages/HomePage.jsx`
  - Navbar (logo + avatar + settings)
  - Hero: pulsing scan button with concentric rings, "Ready to Scan" text
  - Quick stats row: 3 GlassCards (Calories, Protein, Health Score) from /api/nutrition/daily
  - Recent Scans: horizontal scroll of scan cards from /api/scan/history
  - Gym Mode toggle switch
  - BottomNav

### STEP 7.5 — Scan Page
- [ ] `frontend/src/pages/ScanPage.jsx`
  - CameraView with ScanOverlay (full screen)
  - OR UploadZone (tab toggle: Camera / Upload)
  - Capture → show analyzing state → call POST /api/scan/analyze → navigate /results
  - Back button, flash toggle, gallery button

### STEP 7.6 — Results Page
- [ ] `frontend/src/pages/ResultsPage.jsx`
  - HealthScoreHero (animated ring)
  - VoiceWaveform + play button (auto-plays voice_explanation via useVoice)
  - MacroBreakdown (4 cards)
  - IngredientList (expandable)
  - DangerAlert cards (for each warning)
  - MealImprovement card
  - FitnessAssessment (if gymMode)
  - Action buttons: Save, Share, Compare, Ask AI
  - All sections animate in with stagger

### STEP 7.7 — Comparison Page
- [ ] `frontend/src/pages/ComparisonPage.jsx`
  - Two upload zones side by side
  - ComparisonView (shows results after both uploaded)
  - ComparisonTable with winner highlighting
  - AI verdict card at bottom
  - Call POST /api/compare/products

### STEP 7.8 — History Page
- [ ] `frontend/src/pages/HistoryPage.jsx`
  - Daily summary card (progress bars for macros, score ring)
  - Calendar strip (7 days, current highlighted green)
  - Scan feed list (thumbnail, name, score badge, time)
  - Delete scan action
  - Weekly Report button → modal with simple bar charts (custom SVG)

### STEP 7.9 — Chat Page
- [ ] `frontend/src/pages/ChatPage.jsx`
  - ChatInterface (message list, input)
  - SuggestedChips (preset questions)
  - Typing indicator animation
  - Voice input via useSpeechRecognition
  - Calls POST /api/chat/ask
  - Context: passes current scan ID if available

### STEP 7.10 — Profile Page
- [ ] `frontend/src/pages/ProfilePage.jsx`
  - Profile card (avatar, name, goal badge, persona)
  - Stats: total scans, avg score, streak
  - Settings sections: Change Goal, Change AI Voice, Units toggle
  - Sign out button
  - Calls GET /api/user/stats

---

## PHASE 8 — INTEGRATION + POLISH
> Goal: Frontend ↔ Backend fully wired, all flows working end-to-end

### STEP 8.1 — Auth flow wired
- [ ] Firebase Google sign-in on Setup page
- [ ] Token attached to all API calls via api.js interceptor
- [ ] Auth state persisted in Zustand, redirects working

### STEP 8.2 — Full scan flow tested
- [ ] Upload image → POST /api/scan/analyze → results displayed
- [ ] Voice auto-plays on results page
- [ ] Save scan → appears in history
- [ ] Gym mode toggle affects analysis

### STEP 8.3 — Responsive design
- [ ] All pages verified at 375px (mobile)
- [ ] All pages verified at 768px (tablet)
- [ ] All pages verified at 1280px (desktop)
- [ ] BottomNav hidden on desktop, sidebar or top nav shown

### STEP 8.4 — Error states + loading
- [ ] Loading skeletons on all data-fetching pages
- [ ] Error toast/banner for API failures
- [ ] Empty states (no scan history, no results)
- [ ] Retry button on failed scans

### STEP 8.5 — Performance
- [ ] React.lazy() + Suspense for all pages
- [ ] Images lazy loaded
- [ ] API responses cached in Zustand where appropriate

---

## PHASE 9 — DEPLOYMENT PREP
> Goal: Ready to deploy to Vercel (frontend) + Render (backend)

### STEP 9.1 — Environment configs
- [ ] `frontend/.env.production` template documented
- [ ] `backend/.env.production` template documented
- [ ] CORS updated for production domain

### STEP 9.2 — Build verification
- [ ] `cd frontend && npm run build` — 0 errors
- [ ] `cd backend && node index.js` — server starts, /api/health returns 200

### STEP 9.3 — Deploy configs
- [ ] `frontend/vercel.json` — SPA routing (all routes → index.html)
- [ ] `backend/render.yaml` OR backend Vercel serverless config

---

## RESUME GUIDE
When resuming, check this file and find the first task marked [ ] (not started).
The phases must be done in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9.
Within a phase, steps can sometimes be parallelized but generally go in order.

**Current status: Phase 1, Step 1.1 — nothing built yet. Start here.**

---

## KEY DECISIONS (locked in from plans)
- Backend: Express.js on Node.js 20, port 3001
- Frontend: Vite + React 19, port 5173
- AI: Google Gemini 2.0 Flash (server-side only, key never in frontend)
- DB: Firebase Firestore (free tier)
- Auth: Firebase Auth (Google sign-in)
- Storage: Firebase Storage (scan images)
- Voice free: Web Speech API (browser)
- Voice premium: ElevenLabs
- Nutrition: USDA FoodData Central API
- Barcode: Open Food Facts (no key needed)
- State: Zustand
- Icons: Lucide React (NO emoji in UI)
- Design: Cyber-Vitality (dark, neon green #00e639, cyan #00eefc, magenta #fface8)
- Fonts: Sora (display), Hanken Grotesk (body), Space Mono (labels/data)
- All free, no credit card required
