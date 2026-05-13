# ScanAndSee — Development Workflow Reference

> Step-by-step workflow for any developer or AI agent picking up the project.

---

## Quick Start

```bash
# 1. Initialize project
cd D:\scanandsee
npm create vite@latest ./ -- --template react
npm install

# 2. Install dependencies
npm install react-router-dom zustand lucide-react framer-motion react-webcam recharts firebase

# 3. Create environment file
copy .env.example .env
# Fill in API keys (see below)

# 4. Start dev server
npm run dev
```

---

## Environment Variables (.env)

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_USDA_API_KEY=your_usda_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ELEVENLABS_API_KEY=optional_for_premium_voice
```

### Getting Free API Keys (No Credit Card)

| Service | URL | Notes |
|---|---|---|
| **Gemini API** | https://aistudio.google.com/apikey | Free tier: 15 RPM |
| **USDA FoodData** | https://fdc.nal.usda.gov/api-key-signup | Free, unlimited |
| **Firebase** | https://console.firebase.google.com | Free Spark plan |
| **Open Food Facts** | No key needed | Public API |
| **ElevenLabs** | https://elevenlabs.io | Free tier: 10k chars/month |

---

## Build Order (Phase 1 — Step by Step)

### Step 1: Design System CSS
Files to create first:
1. `src/styles/variables.css` — All CSS custom properties from `DESIGN_SYSTEM.md`
2. `src/styles/typography.css` — Google Fonts import + type classes
3. `src/styles/animations.css` — All @keyframe animations
4. `src/styles/components.css` — Glass card, buttons, chips, inputs
5. `src/styles/utilities.css` — Glow, layout helpers
6. `src/index.css` — Import all above, global reset

### Step 2: Reusable Components
Build these components first (they're used everywhere):
1. `GlassCard.jsx` — Frosted glass container
2. `Button.jsx` — Clipped-corner primary button
3. `ProgressRing.jsx` — SVG health score ring with animation
4. `Chip.jsx` — Nutrient type chips
5. `Navbar.jsx` — Top navigation bar
6. `BottomNav.jsx` — Mobile bottom navigation

### Step 3: Page Shell
1. `App.jsx` — React Router setup with all routes
2. `SplashPage.jsx` — Loading screen
3. `HomePage.jsx` — Dashboard with scan button

### Step 4: Core Feature
1. `CameraView.jsx` + `ScanOverlay.jsx` — Camera with HUD
2. `UploadZone.jsx` — Drag & drop
3. `gemini.js` — AI vision API service
4. `ResultsPage.jsx` — Full analysis display
5. `VoiceWaveform.jsx` + `voice.js` — TTS playback

### Step 5: Data Layer
1. `firebase.js` — Firebase initialization
2. `useAppStore.js` — Zustand store
3. Scan history storage + retrieval
4. `HistoryPage.jsx` — Scan feed

---

## Key Commands

```bash
# Development
npm run dev              # Start Vite dev server (localhost:5173)

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Linting
npm run lint             # ESLint check

# Deploy to Vercel
npx vercel               # First time
npx vercel --prod        # Production deploy
```

---

## Testing Workflow

### 1. Visual Check (Every Screen)
Open dev server → navigate to each route → verify:
- [ ] Glass effects render (backdrop-filter)
- [ ] Colors match Cyber-Vitality palette
- [ ] Typography uses correct fonts (Sora, Hanken Grotesk, Space Mono)
- [ ] Icons display (no emoji)
- [ ] Responsive at 375px mobile

### 2. Camera Test
- [ ] Camera permission prompt appears
- [ ] Camera feed displays in viewfinder
- [ ] HUD overlay renders (corner brackets, scan beam)
- [ ] Photo capture works
- [ ] Image upload works (drag & drop + file picker)

### 3. AI Analysis Test
- [ ] Image sent to Gemini API successfully
- [ ] JSON response parsed correctly
- [ ] Health score ring animates
- [ ] Macro cards show correct values
- [ ] Ingredient list populates
- [ ] Danger alerts appear for harmful ingredients
- [ ] Voice explanation plays

### 4. Data Persistence Test
- [ ] Firebase Auth sign-in works
- [ ] Scan saves to Firestore
- [ ] Scan history loads on page refresh
- [ ] Daily log updates correctly

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Backdrop-filter not working | Check browser support; Firefox needs `-webkit-` prefix; ensure parent has `background` not `transparent` |
| Camera black screen | Ensure HTTPS or localhost; check `getUserMedia` permissions |
| Gemini API 429 error | Rate limited; add retry with exponential backoff |
| Fonts not loading | Check Google Fonts import URL; ensure `@import` is first in CSS |
| Clipped button text cut off | Increase padding to account for clip-path chamfer |
| Glow too bright | Reduce box-shadow opacity from 0.5 to 0.3 |

---

## Reference Documents

| Document | Path | Purpose |
|---|---|---|
| **Implementation Plan** | `D:\scanandsee\IMPLEMENTATION_PLAN.md` | Full spec: features, screens, architecture, phases |
| **Backend Plan** | `D:\scanandsee\BACKEND_PLAN.md` | Server architecture, API routes, services, deployment |
| **Design System** | `D:\scanandsee\DESIGN_SYSTEM.md` | CSS tokens, utility classes, icon mapping |
| **Workflow** | `D:\scanandsee\WORKFLOW.md` | This file — build order, commands, testing |
| **Original Ideas** | `D:\scanandsee\plllan.md` | Raw feature brainstorm and pitch |
