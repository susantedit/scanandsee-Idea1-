<div align="center">

<br />

```
  ███████╗ ██████╗ █████╗ ███╗   ██╗ █████╗ ███╗   ██╗██████╗ ███████╗███████╗███████╗
  ██╔════╝██╔════╝██╔══██╗████╗  ██║██╔══██╗████╗  ██║██╔══██╗██╔════╝██╔════╝██╔════╝
  ███████╗██║     ███████║██╔██╗ ██║███████║██╔██╗ ██║██║  ██║███████╗█████╗  █████╗
  ╚════██║██║     ██╔══██║██║╚██╗██║██╔══██║██║╚██╗██║██║  ██║╚════██║██╔══╝  ██╔══╝
  ███████║╚██████╗██║  ██║██║ ╚████║██║  ██║██║ ╚████║██████╔╝███████║███████╗███████╗
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚══════╝
```

**Nutrition intelligence, powered by computer vision.**

<br />

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-MIT-00e639?style=flat-square)](LICENSE)

<br />

[**View on GitHub**](https://github.com/susantedit/scanandsee-Idea1-) &nbsp;·&nbsp;
[**Report a Bug**](https://github.com/susantedit/scanandsee-Idea1-/issues) &nbsp;·&nbsp;
[**Request a Feature**](https://github.com/susantedit/scanandsee-Idea1-/discussions)

<br />

</div>

---

<br />

> **ScanAndSee** turns any smartphone camera into a nutrition intelligence engine.
> Point it at food. Get a complete health analysis in seconds — with voice coaching,
> ingredient safety checks, and personalized recommendations. No manual input. One photo.

<br />

---

<br />

## The Problem

Most people eat without understanding what they consume. Nutrition labels are dense, supplement marketing is deceptive, and calorie-tracking apps demand effort that users abandon within days.

The gap isn't information — it's accessibility.

| Friction | Reality |
|---|---|
| Nutrition labels | Dense, ignored by most people |
| Manual tracking | 80% of users quit within a week |
| Supplement claims | Largely unverified marketing |
| "Healthy" packaging | Often hides HFCS, trans fats, additives |
| Budget nutrition | No accessible guidance for students |

<br />

## The Approach

ScanAndSee removes every friction point with a single interaction: a photo.

The system reads labels, identifies ingredients, calculates macros, scores health quality, and explains everything through a voice AI — all server-side, in under three seconds.

What separates it from existing apps:

- **Vision-first** — no typing, no barcodes required
- **Personality-driven AI** — four distinct voice coaches, not a generic assistant
- **Server-side intelligence** — all AI logic runs on the backend, API keys never touch the client
- **Installable PWA** — runs like a native app on any device, no app store required
- **Entirely free-tier** — built on APIs that require no credit card

<br />

---

<br />

## User Journey

```mermaid
flowchart LR
    A([Open App]) --> B([Scan Food])
    B --> C([AI Analysis])
    C --> D([Health Score])
    D --> E([Voice Feedback])
    E --> F([Save to History])
    F --> G([Track Progress])
    G --> H([Risk Prediction])

    style A fill:#131315,stroke:#00e639,color:#00e639
    style D fill:#131315,stroke:#00e639,color:#00e639
    style H fill:#131315,stroke:#00dbe9,color:#00dbe9
```

<br />

---

<br />

## Features

### Core

| Feature | Description |
|---|---|
| **Camera + Upload** | Live camera with holographic HUD overlay, drag-and-drop fallback |
| **AI Vision** | Gemini 2.0 Flash reads labels, identifies food, estimates macros |
| **Health Score** | 0–10 composite score calculated server-side with a weighted algorithm |
| **Voice AI** | Auto-plays a natural explanation via Web Speech API or Murf AI |
| **Danger Detection** | Flags HFCS, trans fats, artificial colors, excessive sodium |
| **Meal Suggestions** | Actionable improvement tips generated per scan |
| **Scan History** | Firestore-backed feed with thumbnails, scores, and timestamps |

### Intelligence Layer

| Feature | Description |
|---|---|
| **Gym Mode** | Bulking / cutting / pre-workout / post-workout suitability |
| **Voice Personalities** | Doctor · Gym Bro · Coach · Savage Roast |
| **Product Comparison** | Dual image analysis with metric-by-metric winner highlighting |
| **Q&A Chat** | Conversational AI with scan context — "Can diabetics eat this?" |
| **Personalized Goals** | 7 user goals that adapt all AI recommendations |
| **Barcode Lookup** | Open Food Facts integration for packaged goods |
| **Share Cards** | Canvas-generated 800×800 PNG cards for social media |

### Advanced Intelligence

| Feature | Description |
|---|---|
| **Mood Analysis** | Energy crash risk, focus impact, sleep impact per food |
| **Health Risk Prediction** | 7-day eating pattern → diabetes, heart, obesity risk scores |
| **Budget Optimizer** | Enter a budget → AI generates a full meal plan + grocery list |
| **Plate Builder** | Scan 1–2 foods → AI creates the optimal combination |
| **Supplement Analyzer** | Detects fake claims, dangerous ingredients, protein quality |
| **Grocery Cart** | Scan up to 5 products → cart score + swap recommendations |
| **Restaurant Scanner** | Estimates macros from restaurant meal photos |
| **Fake Detection** | Identifies counterfeit supplements and misleading labels |
| **Community** | Share scans, like posts, compete on the leaderboard |

<br />

---

<br />

## AI Processing Pipeline

```mermaid
flowchart TD
    A([Image Upload]) --> B[Image Validation\nMIME type + magic bytes]
    B --> C[Compression\nsharp: 1024px · JPEG 80% · strip EXIF]
    C --> D[Gemini 2.0 Flash\nVision API]
    D --> E[Food Recognition\nLabel reading or visual estimation]
    E --> F[Ingredient Extraction\nSafety classification]
    F --> G[Macro Calculation\nCalories · Protein · Carbs · Fats]
    G --> H[Health Score Engine\nBase 5.0 + weighted modifiers]
    H --> I[USDA Enrichment\nCross-reference for accuracy]
    I --> J[Risk Detection\nDanger flags · Warnings]
    J --> K[Voice Personality Engine\nDoctor · Gym Bro · Coach · Roast]
    K --> L([Results Rendered\nto Client])

    style A fill:#131315,stroke:#00e639,color:#e5e1e4
    style L fill:#131315,stroke:#00e639,color:#e5e1e4
    style D fill:#131315,stroke:#4285F4,color:#e5e1e4
    style H fill:#131315,stroke:#00dbe9,color:#e5e1e4
```

<br />

---

<br />

## Backend Architecture

```mermaid
flowchart LR
    Client([React PWA]) --> Gateway[Express API Gateway\nPort 3001]

    Gateway --> Auth[Auth Middleware\nFirebase RS256]
    Auth --> Validate[Validation Layer\nZod + Sanitizer]

    Validate --> AI[AI Processing\nGemini Service]
    Validate --> DB[Data Layer\nFirebase Service]
    Validate --> Nutrition[Nutrition Service\nUSDA + Open Food Facts]

    AI --> GeminiAPI[(Gemini 2.0 Flash)]
    Nutrition --> USDA[(USDA FoodData)]
    Nutrition --> OFF[(Open Food Facts)]

    DB --> Firestore[(Firestore)]
    Firestore --> Scans[User Scans]
    Firestore --> Logs[Daily Logs]
    Firestore --> Community[Community Feed]

    style Client fill:#131315,stroke:#00e639,color:#e5e1e4
    style GeminiAPI fill:#131315,stroke:#4285F4,color:#e5e1e4
    style Firestore fill:#131315,stroke:#FFCA28,color:#e5e1e4
```

<br />

---

<br />

## Security Request Lifecycle

```mermaid
flowchart TD
    A([Incoming Request]) --> B[Helmet\nSecurity headers · HSTS]
    B --> C[CORS\nOrigin allowlist]
    C --> D[Global Rate Limiter\n100 req / 15 min per user]
    D --> E[Body Parser\n64 KB JSON limit]
    E --> F[Input Sanitizer\nNull bytes · Prototype pollution · HTML]
    F --> G[Firebase Auth\nRS256 token + revocation check]
    G --> H[Endpoint Rate Limiter\nPer-feature quotas]
    H --> I[Zod Validator\nStrict schema · Unknown fields stripped]
    I --> J[Magic Byte Check\nImage upload verification]
    J --> K[Route Controller\nBusiness logic]
    K --> L[AI Output Sanitizer\nStrip HTML from Gemini responses]
    L --> M([Response Sent])

    style A fill:#131315,stroke:#ffb4ab,color:#e5e1e4
    style M fill:#131315,stroke:#00e639,color:#e5e1e4
    style G fill:#131315,stroke:#FFCA28,color:#e5e1e4
```

<br />

---

<br />

## Database Structure

```mermaid
erDiagram
    USERS ||--o{ SCANS : creates
    USERS ||--o{ DAILY_LOGS : tracks
    USERS ||--o{ COMMUNITY_POSTS : shares
    SCANS ||--|| SCAN_RESULTS : generates
    SCAN_RESULTS ||--o{ WARNINGS : contains
    SCAN_RESULTS ||--o{ INGREDIENTS : lists
    COMMUNITY_POSTS ||--o{ LIKES : receives

    USERS {
        string uid PK
        string name
        string email
        string goal
        string aiPersona
        string activityLevel
        string tier
        timestamp createdAt
    }

    SCANS {
        string scanId PK
        string userId FK
        string imageUrl
        float healthScore
        string verdict
        timestamp createdAt
    }

    SCAN_RESULTS {
        string scanId FK
        float calories
        float protein_g
        float carbs_g
        float fats_g
        float sugar_g
        float sodium_mg
        string voiceExplanation
    }

    DAILY_LOGS {
        string dateKey PK
        string userId FK
        float totalCalories
        float totalProtein
        float nutritionScore
        int scansCount
    }
```

<br />

---

<br />

## Frontend State Management

```mermaid
flowchart LR
    Components([React Components\n18 Pages]) --> Store[Zustand Store]

    Store --> Auth[Auth State\nuser · isAuthenticated]
    Store --> Scan[Scan State\ncurrentScan · history]
    Store --> Daily[Daily Stats\ncalories · protein · score]
    Store --> Settings[Settings\ngymMode · persona · goal]

    Store --> Services[API Services\napi.js · community.js]
    Services --> Backend([Express Backend\nlocalhost:3001])

    style Components fill:#131315,stroke:#61DAFB,color:#e5e1e4
    style Store fill:#131315,stroke:#00e639,color:#e5e1e4
    style Backend fill:#131315,stroke:#339933,color:#e5e1e4
```

<br />

---

<br />

## PWA Architecture

```mermaid
flowchart TD
    User([User]) --> Install[Install PWA\nAdd to Home Screen]
    Install --> SW[Service Worker\nsw.js]

    SW --> Cache[Offline Cache\nApp shell · Fonts · Icons]
    SW --> Network[Network First\nAPI calls]
    SW --> Fallback[Offline Fallback\nCached index.html]

    Cache --> FastLaunch[Fast Launch\nNo network needed]
    Network --> Live[Live Data\nScans · History · AI]
    Fallback --> Offline[Offline Support\nView cached scans]

    style User fill:#131315,stroke:#5A0FC8,color:#e5e1e4
    style SW fill:#131315,stroke:#5A0FC8,color:#e5e1e4
    style FastLaunch fill:#131315,stroke:#00e639,color:#e5e1e4
```

<br />

---

<br />

## Product Roadmap

```mermaid
timeline
    title ScanAndSee — Development Timeline

    MVP
        : Camera scan + upload
        : AI vision analysis
        : Health score system
        : Voice AI explanation
        : Ingredient danger detection

    Phase 2
        : Gym Mode
        : Voice personalities
        : Product comparison
        : Daily diet tracker
        : Barcode scanner

    Phase 3
        : Mood and brain analysis
        : Health risk prediction
        : Budget meal optimizer
        : Supplement analyzer
        : Community and leaderboards

    Future
        : Live AR scanning
        : Apple Health sync
        : React Native app
        : Wearable integration
        : AI grocery assistant
```

<br />

---

<br />

## Design System — Cyber-Vitality

A custom design language built for high-performance futurism. The goal: make nutrition data feel like a precision instrument, not a medical form.

### Color

| Role | Hex | Usage |
|---|---|---|
| Primary | `#00e639` | CTAs, health scores, vitality |
| Secondary | `#00dbe9` | Scanning UI, AI indicators, data |
| Tertiary | `#fface8` | Protein highlights, alerts, energy |
| Background | `#131315` | Base canvas |
| Surface | `#201f21` | Cards, panels |
| Error | `#ffb4ab` | Danger alerts, warnings |

### Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display | Sora | 800 | Hero headlines, scores |
| Body | Hanken Grotesk | 400–600 | Descriptions, content |
| Mono | Space Mono | 400–700 | Data labels, timestamps, values |

### Motion Principles

- Default transitions: `300ms ease-out`
- Spring interactions: `420ms cubic-bezier(0.34, 1.56, 0.64, 1)`
- Health score ring: `1.5s ease-out` stroke-dashoffset animation
- Scan beam: `2.5s linear` continuous sweep
- All animations respect `prefers-reduced-motion`

<br />

---

<br />

## Tech Stack

### Frontend

| | Technology | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Build | Vite | 5.4.19 |
| Routing | React Router DOM | 6.26.2 |
| State | Zustand | 4.5.5 |
| Animation | Framer Motion | 11.11.17 |
| Icons | Lucide React | 0.454.0 |
| Auth | Firebase SDK | 10.14.1 |
| PWA | Manual Service Worker | — |

### Backend

| | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.21.2 |
| AI SDK | @google/generative-ai | 0.21.0 |
| Auth | Firebase Admin SDK | 12.7.0 |
| Image | sharp | 0.33.5 |
| Validation | Zod | 3.24.2 |
| Rate Limiting | express-rate-limit | 7.5.0 |
| Security | Helmet | 8.1.0 |
| Logging | Winston + Morgan | 3.17.0 |
| Cache | node-cache | 5.1.2 |

### External Services

| Service | Purpose | Cost |
|---|---|---|
| Google Gemini 2.0 Flash | Vision AI + chat | Free · 15 RPM |
| Firebase Auth | Google sign-in | Free · unlimited |
| Firebase Firestore | Database | Free · 1 GB |
| USDA FoodData Central | Nutrition data | Free · unlimited |
| Open Food Facts | Barcode lookup | Free · unlimited |
| Murf AI | Premium voice TTS | Free · 10k chars/mo |

> All services run on free tiers. No credit card required.

<br />

---

<br />

## Security

```
API keys          server-side only, never in frontend bundles
IDOR protection   every resource scoped to req.user.uid
Atomic writes     FieldValue.increment() prevents race conditions
Input validation  Zod schemas strip unknown fields on every route
Image uploads     magic byte verification catches renamed executables
Auth logging      failures logged with IP for abuse detection
Error responses   stack traces never sent to client in production
```

Rate limits by tier:

| Endpoint | Free | Premium |
|---|---|---|
| `/api/scan/analyze` | 5 / hour | 50 / hour |
| `/api/chat/ask` | 20 / hour | 200 / hour |
| `/api/compare/products` | 3 / hour | 30 / hour |
| `/api/voice/generate` | 10 / hour | 100 / hour |
| Global | 100 / 15 min | 500 / 15 min |

<br />

---

<br />

## Performance

| Metric | Target |
|---|---|
| Scan → results (perceived) | < 3 s |
| Health score ring animation | 1.5 s ease-out |
| Page transitions | 300 ms |
| Voice auto-play delay | 800 ms |
| Image compression | 1024 px max · JPEG 80% |
| Thumbnail size in Firestore | ~10–20 KB base64 |

<br />

---

<br />

## API Reference

### Scan

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan/analyze` | Analyze image → full nutrition JSON |
| `GET` | `/api/scan/history` | Paginated scan history |
| `GET` | `/api/scan/:id` | Single scan |
| `DELETE` | `/api/scan/:id` | Delete scan |

### User

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/profile` | Create or update profile |
| `GET` | `/api/user/profile` | Get profile |
| `GET` | `/api/user/stats` | Scans, avg score, streak |

### Nutrition

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/nutrition/daily` | Today's totals |
| `GET` | `/api/nutrition/weekly` | 7-day report |
| `GET` | `/api/nutrition/search` | USDA food search |
| `GET` | `/api/barcode/:code` | Barcode lookup |

### AI Features

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/compare/products` | Side-by-side image comparison |
| `POST` | `/api/chat/ask` | Q&A with optional scan context |
| `POST` | `/api/voice/generate` | TTS audio generation |
| `POST` | `/api/mood/analyze` | Brain and energy impact |
| `GET` | `/api/risk/predict` | 7-day health risk prediction |
| `POST` | `/api/budget/optimize` | Budget meal plan |
| `POST` | `/api/plate/build` | Optimal meal combination |
| `POST` | `/api/supplement/analyze` | Supplement authenticity |
| `POST` | `/api/grocery/analyze` | Cart analysis (up to 5 items) |

### Community

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/community/feed` | Public scan feed |
| `GET` | `/api/community/leaderboard` | Top healthiest eaters |
| `POST` | `/api/community/share` | Share a scan |
| `POST` | `/api/community/:id/like` | Like a post |
| `DELETE` | `/api/community/:id` | Delete own post |

<br />

---

<br />

## Project Structure

```
scanandsee/
├── frontend/
│   ├── public/
│   │   ├── manifest.json          PWA manifest
│   │   ├── sw.js                  Service worker
│   │   └── icons/                 8 icon sizes (72–512px)
│   └── src/
│       ├── pages/                 18 route-level pages
│       ├── components/
│       │   ├── layout/            Navbar · BottomNav · GlassCard
│       │   ├── ui/                Button · Chip · ProgressRing · MacroCard
│       │   ├── scan/              CameraView · ScanOverlay · UploadZone
│       │   ├── results/           HealthScoreHero · MacroBreakdown · MoodAnalysis
│       │   ├── comparison/        ComparisonTable · ComparisonView
│       │   └── chat/              ChatInterface · SuggestedChips
│       ├── services/              api.js · firebase.js · community.js
│       ├── store/                 Zustand global state
│       ├── hooks/                 useCamera · useVoice · useSpeechRecognition
│       ├── utils/                 scoreColor · formatNutrition
│       └── styles/                Cyber-Vitality design system (5 CSS files)
│
└── backend/
    ├── routes/                    14 route modules
    ├── services/                  gemini · firebase · nutrition · voice · image · score · cache
    ├── middleware/                 auth · rateLimiter · upload · validate · sanitize · errorHandler
    ├── prompts/                   8 Gemini prompt builders
    ├── schemas/                   Zod validation schemas
    ├── config/                    firebase · gemini · constants
    └── utils/                     logger · apiError · helpers · sanitizeOutput
```

<br />

---

<br />

## Installation

### What you need before starting

| Requirement | Where to get it | Cost |
|---|---|---|
| Node.js 20+ | [nodejs.org/download](https://nodejs.org/en/download) | Free |
| Git | [git-scm.com](https://git-scm.com) | Free |
| Firebase project | [console.firebase.google.com](https://console.firebase.google.com) | Free Spark plan |
| Gemini API key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free |
| USDA API key | [fdc.nal.usda.gov/api-key-signup](https://fdc.nal.usda.gov/api-key-signup) | Free |

<br />

### Step 1 — Firebase Setup

Before running the app, you need two things from Firebase:

**A. Create a Firebase project**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it → click through the setup
3. On the left sidebar, enable these services:
   - **Authentication** → Sign-in method → enable **Google**
   - **Firestore Database** → Create database → start in **test mode**

**B. Get the service account key (for the backend)**
1. Firebase Console → gear icon → **Project Settings**
2. Click **Service Accounts** tab
3. Click **Generate new private key** → download the JSON file
4. You'll use `project_id`, `private_key`, and `client_email` from this file

**C. Get the web app config (for the frontend)**
1. Firebase Console → gear icon → **Project Settings**
2. Scroll to **Your apps** → click **Add app** → choose **Web** (`</>`)
3. Register the app → copy the `firebaseConfig` object
4. You'll use `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`

<br />

### Step 2 — Clone the Repository

```bash
git clone https://github.com/susantedit/scanandsee-Idea1-.git
cd scanandsee-Idea1-
```

<br />

### Step 3 — Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google Gemini — aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_key_here

# USDA FoodData — fdc.nal.usda.gov/api-key-signup
USDA_API_KEY=your_usda_key_here

# Firebase Admin — from the service account JSON you downloaded
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR KEY HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Murf AI — murf.ai/api (optional, only needed for premium voice)
MURF_API_KEY=your_murf_key_here
```

> **Important:** The `FIREBASE_PRIVATE_KEY` must include the full key with `\n` line breaks exactly as it appears in the downloaded JSON. Wrap it in double quotes.

Start the backend:

```bash
npm run dev
# Server running at http://localhost:3001
# Health check: http://localhost:3001/api/health
```

<br />

### Step 4 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `frontend/.env` and fill in your Firebase web config:

```env
VITE_API_URL=http://localhost:3001

# From Firebase Console → Project Settings → Your Apps → Web App
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Start the frontend:

```bash
npm run dev
# App running at http://localhost:5173
```

<br />

### Step 5 — Open the App

| URL | What it is |
|---|---|
| `http://localhost:5173` | Frontend — open in browser |
| `http://localhost:3001/api/health` | Backend health check |
| `http://YOUR_LOCAL_IP:5173` | Open on your phone (same WiFi) |

To find your local IP on Windows: run `ipconfig` → look for **IPv4 Address** under your WiFi adapter.

<br />

### Install on Mobile (PWA)

The app installs as a native-feeling app — no app store required.

**Android (Chrome)**
1. Open `http://YOUR_IP:5173` in Chrome
2. Tap the three-dot menu → **Add to Home Screen** → **Install**

**iPhone (Safari)**
1. Open `http://YOUR_IP:5173` in Safari
2. Tap the **Share** button → **Add to Home Screen** → **Add**

Once installed, it opens full-screen with no browser chrome — identical to a native app.

<br />

### Verify Everything Works

```bash
# 1. Backend health check
curl http://localhost:3001/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# 2. Open the frontend
# Navigate to http://localhost:5173
# You should see the ScanAndSee splash screen

# 3. Sign in with Google
# Click through onboarding → set your goal → sign in
# You should land on the Home dashboard

# 4. Test a scan
# Tap the scan button → upload any food photo
# You should see the AI analysis results within ~3 seconds
```

<br />

### Common Issues

| Problem | Fix |
|---|---|
| `Cannot find package 'vite'` | Run `npm install` inside the `frontend/` folder |
| `Firebase not configured` | Check that all `VITE_FIREBASE_*` vars are set in `frontend/.env` |
| `GEMINI_API_KEY not set` | Add your key to `backend/.env` |
| Camera black screen | Must use `localhost` or HTTPS — camera requires a secure context |
| CORS error | Make sure `FRONTEND_URL` in `backend/.env` matches your frontend URL exactly |
| `ENOTEMPTY` on npm install | Delete `node_modules/` and `package-lock.json`, then run `npm install` again |

<br />

---

<br />

## Contributing

Issues, feature requests, and pull requests are welcome.

```bash
# Standard contribution flow
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
# Then open a Pull Request on GitHub
```

Please keep commits focused and PRs scoped to a single concern.

<br />

---

<br />

<div align="center">

MIT License &nbsp;·&nbsp; Built by [susantedit](https://github.com/susantedit)

If this project was useful, a star helps others find it.

**[github.com/susantedit/scanandsee-Idea1-](https://github.com/susantedit/scanandsee-Idea1-)**

</div>
