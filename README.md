<div align="center">

```
  ███████╗ ██████╗ █████╗ ███╗   ██╗ █████╗ ███╗   ██╗██████╗ ███████╗███████╗███████╗
  ██╔════╝██╔════╝██╔══██╗████╗  ██║██╔══██╗████╗  ██║██╔══██╗██╔════╝██╔════╝██╔════╝
  ███████╗██║     ███████║██╔██╗ ██║███████║██╔██╗ ██║██║  ██║███████╗█████╗  █████╗
  ╚════██║██║     ██╔══██║██║╚██╗██║██╔══██║██║╚██╗██║██║  ██║╚════██║██╔══╝  ██╔══╝
  ███████║╚██████╗██║  ██║██║ ╚████║██║  ██║██║ ╚████║██████╔╝███████║███████╗███████╗
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚══════╝
```

**Nutrition intelligence, powered by computer vision.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-orange?style=flat-square)](https://groq.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-MIT-00e639?style=flat-square)](LICENSE)

[**GitHub**](https://github.com/susantedit/scanandsee-Idea1-) &nbsp;·&nbsp; [**Issues**](https://github.com/susantedit/scanandsee-Idea1-/issues) &nbsp;·&nbsp; [**Deploy Guide**](DEPLOY.md)

</div>

---

> **ScanAndSee** turns any smartphone camera into a nutrition intelligence engine.
> Point it at food — or anything. Get a complete analysis in seconds with voice coaching,
> consequence-based insights, and personalized recommendations. No manual input. One photo.

---

## The Problem

Most people eat without understanding what they consume. Nutrition labels are dense, supplement marketing is deceptive, and calorie-tracking apps demand effort that users abandon within days.

| Friction | Reality |
|---|---|
| Nutrition labels | Dense, ignored by most people |
| Manual tracking | 80% of users quit within a week |
| Supplement claims | Largely unverified marketing |
| "Healthy" packaging | Often hides HFCS, trans fats, additives |

---

## What Makes It Different

- **Vision-first** — scan food, supplements, medicine, plants, products, anything
- **Consequence-based AI** — "will spike blood sugar in 90 min" not just "14g sugar"
- **Multi-key rotation** — 5 Gemini keys + 5 Groq keys, never hits rate limits
- **Personality-driven voice** — Doctor, Gym Bro, Coach, Savage Roast
- **AI Memory** — remembers your eating patterns, personalizes every response
- **Installable PWA** — works like a native app, no app store needed
- **100% free-tier APIs** — no credit card required

---

## User Journey

```mermaid
flowchart LR
    A([Open App]) --> B([Scan Anything])
    B --> C([AI Analysis])
    C --> D([Body Consequences])
    D --> E([Voice Coaching])
    E --> F([Save + Track])
    F --> G([Daily Body Score])
    G --> H([Risk Prediction])
```

---

## Features

### Core (Phase 1)
| Feature | Description |
|---|---|
| Universal Scanner | Detects food, medicine, plants, supplements, products — anything |
| AI Vision Analysis | Gemini 2.0 Flash with 5-key rotation |
| Consequence Intelligence | "Will spike blood sugar" not just "14g sugar" |
| Health Score | 0–10 server-side algorithm with score reason |
| Voice AI | Web Speech API (free) + Murf AI (premium), 4 personalities |
| Danger Detection | HFCS, trans fats, artificial colors, excessive sodium |
| Scan History | Firestore-backed with base64 thumbnails |

### Intelligence Layer (Phase 2)
| Feature | Description |
|---|---|
| Gym Mode | Bulking/cutting/pre-workout/post-workout assessment |
| AI Memory | Remembers eating patterns, personalizes chat responses |
| Body Score | Daily aggregate score — "Your body score today: 82" |
| Proactive Warnings | "You've scanned 4 high-sugar foods this week" |
| Product Comparison | Dual image analysis with winner highlighting |
| AI Chat | Conversational Q&A with scan context + memory |
| Budget Optimizer | Enter budget → AI generates meal plan + grocery list |
| Health Risk Prediction | 7-day pattern → diabetes, heart, obesity risk scores |

### Advanced (Phase 3)
| Feature | Description |
|---|---|
| Supplement Analyzer | Fake claims, dangerous doses, protein quality |
| Grocery Cart | Scan up to 5 products → full cart analysis |
| Restaurant Scanner | Estimates macros from restaurant meal photos |
| Fake Detection | Counterfeit supplements and misleading labels |
| Community | Share scans, leaderboard, like posts |
| Wearables | Google Fit / Apple Health sync |
| Enterprise | Team dashboards, insurance integration |
| Marketplace | AI-curated product recommendations |

---

## AI Architecture

```mermaid
flowchart TD
    A([Image Upload]) --> B[Magic Byte Validation]
    B --> C[sharp: resize + compress + strip EXIF]
    C --> D{Gemini 2.0 Flash\n5-key rotation}
    D -->|429 on key 1| E[Auto-rotate to key 2]
    E --> D
    D --> F[Universal Detection\nfood/medicine/plant/product/anything]
    F --> G[Consequence Analysis\nbody effects not just numbers]
    G --> H[Server-side Health Score]
    H --> I[USDA Enrichment]
    I --> J[Firestore Save]
    J --> K([Results + Voice])
```

---

## Request Security Chain

```
Request → Helmet → CORS → Rate Limiter → Body Parser
       → Input Sanitizer → Firebase Auth (RS256)
       → Zod Validator → Magic Byte Check
       → Route Handler → AI Output Sanitizer → Response
```

---

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
| Auth | Firebase SDK | 9.23.0 |
| PWA | Manual Service Worker | — |

### Backend
| | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.21.2 |
| Vision AI | Gemini 2.0 Flash (5-key rotation) | 0.21.0 |
| Text AI | Groq llama-3.3-70b (5-key rotation) | 0.9.1 |
| Auth | Firebase Admin SDK | 12.7.0 |
| Image | sharp | 0.33.5 |
| Validation | Zod | 3.24.2 |
| Security | Helmet + express-rate-limit | — |

### External APIs (all free)
| Service | Purpose | Free Tier |
|---|---|---|
| Gemini 2.0 Flash | Vision AI (scan/compare) | 15 RPM × 5 keys |
| Groq llama-3.3-70b | Text AI (chat/mood/budget) | High RPM × 5 keys |
| Firebase Auth | Google sign-in | Unlimited |
| Firebase Firestore | Database | 1 GB |
| USDA FoodData | Nutrition database | Unlimited |
| Open Food Facts | Barcode lookup | Unlimited |
| Murf AI | Premium voice TTS | 10k chars/mo |

---

## Project Structure

```
scanandsee/
├── frontend/                    React + Vite PWA
│   ├── public/                  manifest.json · sw.js · icons/
│   └── src/
│       ├── pages/               18 pages
│       ├── components/          25+ components
│       ├── services/            api.js · firebase.js · aiMemory.js · notifications.js
│       ├── store/               Zustand state
│       └── styles/              Cyber-Vitality design system
│
└── backend/                     Express.js API
    ├── routes/                  17 route modules
    ├── services/                gemini · groq · firebase · nutrition · voice · image · score
    ├── middleware/               auth · rateLimiter · upload · validate · sanitize
    ├── prompts/                 8 AI prompt builders
    ├── config/                  firebase · gemini (multi-key) · groq (multi-key)
    └── utils/                   logger · apiError · helpers · sanitizeOutput
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Firebase project (free Spark plan)
- Gemini API key — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Groq API key — [console.groq.com/keys](https://console.groq.com/keys)

### Run locally

```bash
# Clone
git clone https://github.com/susantedit/scanandsee-Idea1-.git
cd scanandsee-Idea1-

# Backend
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev            # http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env   # fill in Firebase config
npm start              # http://localhost:5173
```

### Key environment variables

**`backend/.env`**
```env
GEMINI_API_KEY=your_key          # aistudio.google.com/apikey
GEMINI_API_KEY_1=key1            # add multiple for rotation
GEMINI_API_KEY_2=key2
GROQ_API_KEY_1=gsk_...           # console.groq.com/keys
GROQ_API_KEY_2=gsk_...
FIREBASE_PROJECT_ID=your_project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
```

---

## Deploy to Production

See **[DEPLOY.md](DEPLOY.md)** for full step-by-step instructions.

**Quick summary:**

```bash
# Backend → Render.com
# 1. Push to GitHub
# 2. New Web Service → connect repo → rootDir: backend
# 3. Add all env vars from backend/.env
# 4. Deploy

# Frontend → Vercel
cd frontend
npx vercel --prod
# Add VITE_API_URL=https://your-backend.onrender.com in Vercel dashboard
```

---

## API Reference

| Group | Endpoints |
|---|---|
| Scan | POST /analyze · GET /history · GET /:id · DELETE /:id |
| User | POST/GET /profile · GET /stats |
| Nutrition | GET /daily · GET /weekly · GET /search |
| AI Features | POST /compare · POST /chat/ask · POST /voice/generate |
| Intelligence | POST /mood/analyze · GET /risk/predict · POST /budget/optimize |
| Advanced | POST /plate/build · POST /supplement/analyze · POST /grocery/analyze |
| Community | GET/POST /feed · GET /leaderboard · POST /share |
| Admin | GET /dashboard · GET /users · DELETE /community/:id |

---

## Design System — Cyber-Vitality

| Token | Value | Usage |
|---|---|---|
| Primary | `#00e639` Electric Green | CTAs, health scores |
| Secondary | `#00dbe9` Cyber Cyan | AI scanning, data |
| Tertiary | `#fface8` Neon Magenta | Protein, alerts |
| Background | `#131315` Deep Void | Canvas |
| Font Display | Sora 800 | Headlines |
| Font Body | Hanken Grotesk | Content |
| Font Mono | Space Mono | Data labels |

---

## Contributing

```bash
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
# Open a Pull Request
```

---

<div align="center">

MIT License &nbsp;·&nbsp; Built by [susantedit](https://github.com/susantedit)

**[github.com/susantedit/scanandsee-Idea1-](https://github.com/susantedit/scanandsee-Idea1-)**

</div>
