# ScanAndSee — Backend Architecture Plan

> Complete backend specification for the ScanAndSee AI Nutrition Assistant.  
> All API keys stay server-side. Frontend never touches external APIs directly.

---

## Table of Contents
1. [Why a Backend](#1-why-a-backend)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure](#4-folder-structure)
5. [API Routes](#5-api-routes)
6. [Middleware](#6-middleware)
7. [Services Layer](#7-services-layer)
8. [Database Schema (Firestore)](#8-database-schema-firestore)
9. [AI Pipeline (Server-Side)](#9-ai-pipeline-server-side)
10. [Authentication Flow](#10-authentication-flow)
11. [Rate Limiting & Caching](#11-rate-limiting--caching)
12. [Environment Variables](#12-environment-variables)
13. [Error Handling](#13-error-handling)
14. [Deployment](#14-deployment)
15. [Backend Development Phases](#15-backend-development-phases)
16. [Backend Verification Plan](#16-backend-verification-plan)

---

## 1. Why a Backend

| Problem | Solution |
|---|---|
| Gemini API key exposed in frontend JS | Server proxies all AI calls, key stays in `.env` |
| No rate limiting on client-side | Server enforces per-user scan limits |
| Complex AI prompt logic is fragile in frontend | Server owns prompt engineering + response validation |
| Nutrition data aggregation from 3 APIs | Server merges Gemini + USDA + Open Food Facts into one response |
| Voice generation needs API key (ElevenLabs) | Server generates audio, returns URL or stream |
| No caching = wasted API calls | Server caches repeated barcode/food lookups |
| Security: user data manipulation | Server validates + sanitizes all writes to Firestore |

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | **Node.js 20+** | JavaScript everywhere, huge ecosystem |
| Framework | **Express.js** | Lightweight, battle-tested, fast to build |
| AI | **Google Gemini 2.0 Flash** (via `@google/generative-ai` SDK) | Best free-tier multimodal AI |
| Database | **Firebase Firestore** (via `firebase-admin`) | Free tier, real-time, no SQL setup |
| Auth | **Firebase Auth** (verify ID tokens server-side) | Secure token verification |
| File Storage | **Firebase Storage** (via `firebase-admin`) | Store scanned images |
| Nutrition API | **USDA FoodData Central** | Free, comprehensive nutrition DB |
| Barcode API | **Open Food Facts** | Free, global barcode database |
| Voice (Premium) | **ElevenLabs API** | High-quality AI voices |
| Voice (Free) | Client-side Web Speech API | No server needed for free tier |
| Caching | **node-cache** (in-memory) | Simple, no Redis needed for MVP |
| Rate Limiting | **express-rate-limit** | Per-IP and per-user throttling |
| Validation | **zod** | Schema validation for request bodies |
| CORS | **cors** | Allow frontend origin |
| Logging | **morgan** + **winston** | Request logging + structured app logs |
| Image Processing | **sharp** | Resize/compress uploaded images before AI |
| Hosting | **Vercel Serverless** or **Render.com** (free) | Zero-cost hosting |

---

## 3. Architecture Overview

```mermaid
flowchart LR
    subgraph Client["Frontend (React)"]
        A[User Action] --> B[API Call via fetch]
    end
    
    subgraph Server["Backend (Express)"]
        B --> C[Auth Middleware]
        C --> D[Rate Limiter]
        D --> E[Route Handler]
        E --> F{Service Layer}
        F --> G[Gemini Vision Service]
        F --> H[Nutrition Service]
        F --> I[Voice Service]
        F --> J[Firebase Service]
    end
    
    subgraph External["External APIs"]
        G --> K[Google Gemini API]
        H --> L[USDA FoodData API]
        H --> M[Open Food Facts API]
        I --> N[ElevenLabs API]
        J --> O[Firebase / Firestore]
    end
    
    E --> |Response| B
```

**Data Flow for a Scan:**
```
1. Client uploads image → POST /api/scan/analyze
2. Server auth middleware verifies Firebase ID token
3. Rate limiter checks user hasn't exceeded daily scan limit
4. Image compressed via sharp (max 1MB, 1024px wide)
5. Image uploaded to Firebase Storage → get URL
6. Image sent to Gemini Vision API with structured prompt
7. Gemini returns nutrition JSON
8. Server enriches: cross-references with USDA for accuracy
9. Server calculates composite health score
10. Server generates voice explanation text
11. Result stored in Firestore under user's scan collection
12. Full result returned to client
```

---

## 4. Folder Structure

```
D:\scanandsee\server\
├── package.json
├── .env                          # API keys (gitignored)
├── .env.example
├── index.js                      # Entry point — Express app
│
├── config/
│   ├── firebase.js               # Firebase Admin SDK init
│   ├── gemini.js                 # Gemini client init
│   └── constants.js              # Rate limits, scan limits, etc.
│
├── middleware/
│   ├── auth.js                   # Firebase ID token verification
│   ├── rateLimiter.js            # express-rate-limit config
│   ├── upload.js                 # multer config for image uploads
│   ├── validate.js               # Zod schema validation wrapper
│   └── errorHandler.js           # Global error handler
│
├── routes/
│   ├── scan.routes.js            # /api/scan/*
│   ├── nutrition.routes.js       # /api/nutrition/*
│   ├── voice.routes.js           # /api/voice/*
│   ├── user.routes.js            # /api/user/*
│   ├── compare.routes.js         # /api/compare/*
│   ├── chat.routes.js            # /api/chat/*
│   └── barcode.routes.js         # /api/barcode/*
│
├── services/
│   ├── gemini.service.js         # Gemini Vision API calls + prompts
│   ├── nutrition.service.js      # USDA + Open Food Facts lookups
│   ├── voice.service.js          # ElevenLabs TTS generation
│   ├── firebase.service.js       # Firestore CRUD operations
│   ├── image.service.js          # Image processing (sharp)
│   ├── score.service.js          # Health score calculation logic
│   └── cache.service.js          # In-memory cache wrapper
│
├── prompts/
│   ├── analyze.prompt.js         # Main food analysis prompt
│   ├── compare.prompt.js         # Product comparison prompt
│   ├── chat.prompt.js            # Q&A conversation prompt
│   └── voice.prompt.js           # Voice explanation generation
│
├── schemas/
│   ├── scan.schema.js            # Zod schema: scan request/response
│   ├── user.schema.js            # Zod schema: user profile
│   ├── compare.schema.js         # Zod schema: comparison request
│   └── chat.schema.js            # Zod schema: chat message
│
├── utils/
│   ├── logger.js                 # Winston logger config
│   ├── apiError.js               # Custom error class
│   └── helpers.js                # Shared helper functions
│
└── tests/
    ├── scan.test.js
    ├── nutrition.test.js
    └── score.test.js
```

---

## 5. API Routes

### Scan Routes (`/api/scan`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `POST` | `/api/scan/analyze` | ✅ | Analyze a food image | `multipart/form-data: image file + gymMode: bool` | Full analysis JSON (see §9) |
| `GET` | `/api/scan/history` | ✅ | Get user's scan history | Query: `?limit=20&offset=0` | Array of past scan summaries |
| `GET` | `/api/scan/:scanId` | ✅ | Get single scan details | — | Full scan object |
| `DELETE` | `/api/scan/:scanId` | ✅ | Delete a scan | — | `{ success: true }` |

### Nutrition Routes (`/api/nutrition`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `GET` | `/api/nutrition/search` | ✅ | Search USDA food database | Query: `?query=chicken+breast` | Array of food matches with nutrition |
| `GET` | `/api/nutrition/daily` | ✅ | Get today's nutrition summary | — | `{ calories, protein, carbs, fats, score }` |
| `GET` | `/api/nutrition/weekly` | ✅ | Get weekly report | — | Array of 7 daily summaries + trends |

### Voice Routes (`/api/voice`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `POST` | `/api/voice/generate` | ✅ | Generate voice explanation | `{ text, personality, premium }` | Audio URL or audio stream |
| `GET` | `/api/voice/personalities` | ❌ | List available voice options | — | Array of personality objects |

### User Routes (`/api/user`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `POST` | `/api/user/profile` | ✅ | Create/update profile | `{ name, age, weight, goal, aiPersona, activityLevel }` | Updated profile object |
| `GET` | `/api/user/profile` | ✅ | Get current profile | — | Profile object |
| `GET` | `/api/user/stats` | ✅ | Get user statistics | — | `{ totalScans, avgScore, streak, memberSince }` |

### Compare Routes (`/api/compare`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `POST` | `/api/compare/products` | ✅ | Compare two food items | `multipart/form-data: imageA, imageB` | Comparison result JSON |

### Chat Routes (`/api/chat`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `POST` | `/api/chat/ask` | ✅ | Ask AI about food | `{ question, scanId? (optional context) }` | `{ answer, suggestions[] }` |

### Barcode Routes (`/api/barcode`)

| Method | Endpoint | Auth | Description | Request | Response |
|---|---|---|---|---|---|
| `GET` | `/api/barcode/:code` | ✅ | Lookup barcode | — | Product info + nutrition |

---

## 6. Middleware

### Auth Middleware (`middleware/auth.js`)
```javascript
import admin from '../config/firebase.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }
};
```

### Rate Limiter (`middleware/rateLimiter.js`)
```javascript
import rateLimit from 'express-rate-limit';

// Global: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, try again later' }
});

// Scan: 5 scans per hour for free tier, 50 for premium
export const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { error: 'Scan limit reached. Upgrade for more scans.' }
});

// Voice: 10 generations per hour
export const voiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.uid || req.ip,
});
```

### Upload Middleware (`middleware/upload.js`)
```javascript
import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and HEIC images are allowed'));
    }
  }
}).single('image');
```

---

## 7. Services Layer

### Gemini Vision Service (`services/gemini.service.js`)
```javascript
// Key responsibilities:
// 1. Accept compressed image buffer
// 2. Build structured prompt from prompts/analyze.prompt.js
// 3. Send to Gemini 2.0 Flash with JSON response format
// 4. Parse + validate response with Zod
// 5. Return typed analysis object
// 6. Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)

export async function analyzeFood(imageBuffer, options = {}) {
  // options: { gymMode: bool, userGoal: string }
  // Returns: validated NutritionAnalysis object
}

export async function compareProducts(imageBufferA, imageBufferB) {
  // Returns: ComparisonResult object
}

export async function chatAboutFood(question, scanContext = null) {
  // Returns: { answer: string, suggestions: string[] }
}
```

### Nutrition Service (`services/nutrition.service.js`)
```javascript
// Key responsibilities:
// 1. Search USDA FoodData Central
// 2. Fetch Open Food Facts by barcode
// 3. Merge + normalize data from multiple sources
// 4. Cache results for 24 hours

export async function searchUSDA(query) { /* ... */ }
export async function lookupBarcode(barcode) { /* ... */ }
export async function enrichAnalysis(geminiResult) {
  // Cross-reference Gemini's estimates with USDA data for accuracy
}
```

### Score Service (`services/score.service.js`)
```javascript
// Health Score Algorithm (0-10):
// 
// Base score = 5
// 
// Positive modifiers:
//   +1.0  High protein (>20g per serving)
//   +0.5  Good fiber (>5g)
//   +0.5  Low sugar (<5g)
//   +0.5  Low sodium (<400mg)
//   +0.5  No dangerous additives
//   +0.5  Contains vitamins/minerals
//   +0.5  Whole food (not ultra-processed)
//
// Negative modifiers:
//   -1.0  Dangerous additives detected
//   -0.5  High sugar (>15g)
//   -0.5  High sodium (>800mg)
//   -0.5  Trans fats present
//   -0.5  Very low protein (<3g)
//   -0.5  Ultra-processed
//   -1.0  Multiple health warnings
//
// Clamped to [0, 10], rounded to 1 decimal

export function calculateHealthScore(analysis) { /* ... */ }
export function calculateDailyScore(dailyLog) { /* ... */ }
```

### Image Service (`services/image.service.js`)
```javascript
// Key responsibilities:
// 1. Resize image to max 1024px width (maintains aspect ratio)
// 2. Convert to JPEG at 80% quality
// 3. Strip EXIF metadata
// 4. Return buffer + upload to Firebase Storage
// 5. Generate public URL

import sharp from 'sharp';

export async function processImage(buffer) {
  return sharp(buffer)
    .resize(1024, null, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .withMetadata(false)
    .toBuffer();
}

export async function uploadToStorage(buffer, userId, scanId) {
  // Upload to Firebase Storage bucket
  // Return public download URL
}
```

### Voice Service (`services/voice.service.js`)
```javascript
// Key responsibilities:
// 1. Generate voice audio from text
// 2. Free tier: return text (client uses Web Speech API)
// 3. Premium tier: call ElevenLabs, return audio URL
// 4. Support personality mapping to voice IDs

const VOICE_MAP = {
  doctor:       'ElevenLabs-Voice-ID-1',
  gym_bro:      'ElevenLabs-Voice-ID-2',
  coach:        'ElevenLabs-Voice-ID-3',
  savage_roast: 'ElevenLabs-Voice-ID-4',
};

export async function generateVoice(text, personality, isPremium) {
  if (!isPremium) {
    return { type: 'text', data: text }; // Client-side TTS
  }
  // Call ElevenLabs API, store audio in Firebase Storage
  return { type: 'audio', url: audioUrl };
}
```

---

## 8. Database Schema (Firestore)

```
├── users/
│   └── {uid}/
│       ├── profile: {
│       │     name: string,
│       │     email: string,
│       │     age: number | null,
│       │     weight: number | null,
│       │     weightUnit: 'kg' | 'lbs',
│       │     activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete',
│       │     goal: 'weight_loss' | 'muscle_gain' | 'bulking' | 'cutting' | 
│       │           'healthy_eating' | 'diabetic' | 'student_budget',
│       │     aiPersona: 'doctor' | 'gym_bro' | 'coach' | 'savage_roast',
│       │     tier: 'free' | 'premium',
│       │     createdAt: timestamp,
│       │     updatedAt: timestamp
│       │   }
│       │
│       ├── scans/ (subcollection)
│       │   └── {scanId}: {
│       │         imageUrl: string,
│       │         foodName: string,
│       │         healthScore: number (0-10),
│       │         verdict: 'HEALTHY' | 'MODERATE' | 'UNHEALTHY',
│       │         calories: number,
│       │         protein: number,
│       │         carbs: number,
│       │         fats: number,
│       │         sugar: number,
│       │         sodium: number,
│       │         fiber: number,
│       │         ingredients: [{
│       │           name: string,
│       │           safety: 'safe' | 'moderate' | 'dangerous',
│       │           sideEffect: string,
│       │           alternative: string
│       │         }],
│       │         warnings: [{
│       │           text: string,
│       │           riskType: 'diabetes' | 'heart' | 'obesity' | 'cancer' | 'allergy'
│       │         }],
│       │         improvements: [string],
│       │         gymAssessment: {
│       │           goodForBulking: bool,
│       │           goodForCutting: bool,
│       │           preWorkout: bool,
│       │           postWorkout: bool,
│       │           proteinQuality: number (0-10),
│       │           muscleRecovery: number (0-10)
│       │         } | null,
│       │         voiceExplanation: string,
│       │         createdAt: timestamp
│       │       }
│       │
│       └── dailyLogs/ (subcollection)
│           └── {YYYY-MM-DD}: {
│                 totalCalories: number,
│                 totalProtein: number,
│                 totalCarbs: number,
│                 totalFats: number,
│                 totalSugar: number,
│                 scansCount: number,
│                 nutritionScore: number (0-10),
│                 scanRefs: [string] // scanId references
│               }
```

---

## 9. AI Pipeline (Server-Side)

### Main Analysis Prompt (`prompts/analyze.prompt.js`)

```javascript
export function buildAnalysisPrompt(options = {}) {
  const gymSection = options.gymMode ? `
Also assess gym/fitness suitability:
- "good_for_bulking": boolean
- "good_for_cutting": boolean  
- "pre_workout": boolean
- "post_workout": boolean
- "protein_quality_score": 0-10
- "muscle_recovery_score": 0-10` : '';

  const goalContext = options.userGoal 
    ? `\nThe user's goal is: ${options.userGoal}. Tailor recommendations accordingly.` 
    : '';

  return `You are an expert nutritionist AI. Analyze this food image thoroughly.

Identify the food item(s) visible. If it's a packaged product, read the nutrition label and ingredients list. If it's a meal, estimate the nutritional content.

Return a JSON object with EXACTLY this structure:
{
  "food_name": "string - name of the food item",
  "health_score": number (0-10, where 10 is extremely healthy),
  "verdict": "HEALTHY" | "MODERATE" | "UNHEALTHY",
  "calories": number (kcal per serving),
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "fiber_g": number,
  "serving_size": "string describing the serving",
  "ingredients": [
    {
      "name": "ingredient name",
      "safety": "safe" | "moderate" | "dangerous",
      "side_effect": "short description if moderate/dangerous, empty if safe",
      "alternative": "healthier alternative if moderate/dangerous, empty if safe"
    }
  ],
  "warnings": [
    {
      "text": "warning description",
      "risk_type": "diabetes" | "heart" | "obesity" | "cancer" | "allergy"
    }
  ],
  "improvements": [
    "specific actionable suggestion to make this meal healthier"
  ],
  ${gymSection ? `"gym_assessment": { ${gymSection} },` : ''}
  "voice_explanation": "A natural, conversational 2-3 sentence explanation a nutrition coach would give. Be specific to this food. ${options.personality === 'savage_roast' ? 'Be brutally honest and funny.' : options.personality === 'gym_bro' ? 'Talk like an enthusiastic gym bro.' : 'Be professional but friendly.'}"
}
${goalContext}

Rules:
- Be accurate. Don't guess wildly.
- If you can read a nutrition label, use those exact values.
- If estimating, provide reasonable estimates and note uncertainty.
- Flag ALL dangerous additives (HFCS, trans fats, excessive sodium, artificial colors).
- Provide at least 2 improvement suggestions.
- Voice explanation must sound natural, not robotic.`;
}
```

### Comparison Prompt (`prompts/compare.prompt.js`)
```javascript
export const COMPARE_PROMPT = `You are comparing two food products.
Analyze both images and return JSON:
{
  "product_a": { "name": string, "health_score": 0-10, "calories": num, "protein_g": num, "carbs_g": num, "fats_g": num, "sugar_g": num, "dangerous_ingredients": [string] },
  "product_b": { same structure },
  "winner": "A" | "B" | "TIE",
  "reason": "string explaining why the winner is better",
  "comparison_details": [
    { "metric": "Protein", "a_value": string, "b_value": string, "winner": "A"|"B"|"TIE" }
  ]
}`;
```

### Response Validation
Every Gemini response is validated with a Zod schema before being sent to the client:

```javascript
import { z } from 'zod';

const IngredientSchema = z.object({
  name: z.string(),
  safety: z.enum(['safe', 'moderate', 'dangerous']),
  side_effect: z.string().default(''),
  alternative: z.string().default('')
});

const AnalysisSchema = z.object({
  food_name: z.string(),
  health_score: z.number().min(0).max(10),
  verdict: z.enum(['HEALTHY', 'MODERATE', 'UNHEALTHY']),
  calories: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fats_g: z.number().nonnegative(),
  sugar_g: z.number().nonnegative(),
  sodium_mg: z.number().nonnegative(),
  fiber_g: z.number().nonnegative(),
  serving_size: z.string().optional(),
  ingredients: z.array(IngredientSchema),
  warnings: z.array(z.object({
    text: z.string(),
    risk_type: z.enum(['diabetes', 'heart', 'obesity', 'cancer', 'allergy'])
  })),
  improvements: z.array(z.string()),
  gym_assessment: z.object({
    good_for_bulking: z.boolean(),
    good_for_cutting: z.boolean(),
    pre_workout: z.boolean(),
    post_workout: z.boolean(),
    protein_quality_score: z.number().min(0).max(10),
    muscle_recovery_score: z.number().min(0).max(10)
  }).optional(),
  voice_explanation: z.string()
});
```

---

## 10. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (React)
    participant S as Backend (Express)
    participant FA as Firebase Auth

    U->>F: Click "Sign In with Google"
    F->>FA: signInWithPopup(GoogleAuthProvider)
    FA-->>F: User credential + ID token
    F->>F: Store ID token in memory
    F->>S: GET /api/user/profile (Authorization: Bearer <token>)
    S->>FA: admin.auth().verifyIdToken(token)
    FA-->>S: Decoded token { uid, email }
    S->>S: Fetch/create user profile in Firestore
    S-->>F: User profile JSON
    F->>F: Store in Zustand, render Dashboard
```

**Token refresh:** Firebase SDK auto-refreshes tokens. Frontend calls `getIdToken(true)` before each API request.

---

## 11. Rate Limiting & Caching

### Rate Limits

| Endpoint | Free Tier | Premium Tier |
|---|---|---|
| `/api/scan/analyze` | 5/hour | 50/hour |
| `/api/voice/generate` | 10/hour | 100/hour |
| `/api/chat/ask` | 20/hour | 200/hour |
| `/api/compare/products` | 3/hour | 30/hour |
| Global (all routes) | 100/15min | 500/15min |

### Caching Strategy

| Data | TTL | Cache Key | Storage |
|---|---|---|---|
| USDA food search results | 24 hours | `usda:${query}` | node-cache |
| Barcode lookups | 7 days | `barcode:${code}` | node-cache |
| Voice personalities list | 1 hour | `voices:list` | node-cache |
| User profile | 5 min | `user:${uid}` | node-cache |
| Scan results | No cache (unique each time) | — | Firestore only |

---

## 12. Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# USDA FoodData Central  
USDA_API_KEY=your_usda_api_key

# Firebase Admin (service account)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# ElevenLabs (optional, for premium voice)
ELEVENLABS_API_KEY=your_elevenlabs_key

# Rate Limits
FREE_SCAN_LIMIT=5
PREMIUM_SCAN_LIMIT=50
```

---

## 13. Error Handling

### Custom Error Class
```javascript
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Usage:
throw new ApiError(400, 'No image provided');
throw new ApiError(429, 'Scan limit reached', { limit: 5, resetIn: '45 minutes' });
throw new ApiError(502, 'AI service temporarily unavailable');
```

### Global Error Handler
```javascript
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  logger.error(`${statusCode} - ${message}`, { 
    path: req.path, 
    method: req.method,
    userId: req.user?.uid,
    stack: err.stack 
  });
  
  res.status(statusCode).json({
    error: message,
    details: err.details || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Standard Error Responses

| Status | When | Example |
|---|---|---|
| `400` | Bad request / validation fail | Missing image, invalid barcode format |
| `401` | Missing or invalid auth token | No Bearer token, expired token |
| `403` | Insufficient permissions | Free user accessing premium feature |
| `404` | Resource not found | Scan ID doesn't exist, barcode not found |
| `429` | Rate limited | Too many scans, too many requests |
| `502` | External API failure | Gemini timeout, USDA down |
| `500` | Unexpected server error | Unhandled exception |

---

## 14. Deployment

### Option A: Vercel Serverless (Recommended for MVP)

Convert Express routes to Vercel serverless functions:

```
D:\scanandsee\
├── api/                          # Vercel serverless functions
│   ├── scan/
│   │   ├── analyze.js            # POST /api/scan/analyze
│   │   ├── history.js            # GET /api/scan/history
│   │   └── [scanId].js           # GET/DELETE /api/scan/:scanId
│   ├── nutrition/
│   │   ├── search.js
│   │   ├── daily.js
│   │   └── weekly.js
│   ├── voice/
│   │   ├── generate.js
│   │   └── personalities.js
│   ├── user/
│   │   ├── profile.js
│   │   └── stats.js
│   ├── compare/
│   │   └── products.js
│   ├── chat/
│   │   └── ask.js
│   └── barcode/
│       └── [code].js
├── lib/                          # Shared server code
│   ├── services/
│   ├── middleware/
│   ├── prompts/
│   ├── schemas/
│   └── config/
├── src/                          # Frontend (unchanged)
└── vercel.json
```

**vercel.json:**
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Option B: Render.com (Traditional Express Server)

```yaml
# render.yaml
services:
  - type: web
    name: scanandsee-api
    env: node
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false
```

> [!TIP]
> **Recommendation:** Start with **Vercel serverless** (Option A). It's simpler—frontend and backend deploy together, no separate server to manage. All the services/middleware code lives in `/lib/` and is imported by the serverless functions in `/api/`.

---

## 15. Backend Development Phases

### Phase B1 — Foundation (Week 1)
- [ ] Initialize Node.js project in `/server` (or `/api` + `/lib` for Vercel)
- [ ] Firebase Admin SDK setup + Firestore connection
- [ ] Auth middleware (verify Firebase ID tokens)
- [ ] Global error handler + logger
- [ ] Rate limiter middleware
- [ ] Image upload middleware (multer) + sharp processing
- [ ] Basic health check endpoint: `GET /api/health`

### Phase B2 — Core Scanning API (Week 2)
- [ ] `POST /api/scan/analyze` — full pipeline:
  - Image upload → compress → Gemini Vision → validate → store → respond
- [ ] Analysis prompt engineering + Zod validation
- [ ] Health score calculation service
- [ ] `GET /api/scan/history` + `GET /api/scan/:scanId`
- [ ] Daily log auto-update on each scan
- [ ] CORS configuration for frontend

### Phase B3 — Nutrition & Voice (Week 3)
- [ ] USDA FoodData integration + caching
- [ ] Open Food Facts barcode lookup
- [ ] Nutrition enrichment pipeline (merge Gemini + USDA data)
- [ ] `POST /api/voice/generate` (ElevenLabs for premium)
- [ ] Voice personality mapping
- [ ] `GET /api/nutrition/daily` + `GET /api/nutrition/weekly`

### Phase B4 — Enhanced Features (Week 4)
- [ ] `POST /api/compare/products` — dual image analysis
- [ ] `POST /api/chat/ask` — conversational Q&A with scan context
- [ ] `POST/GET /api/user/profile` — full CRUD
- [ ] `GET /api/user/stats` — aggregated statistics
- [ ] `GET /api/barcode/:code` — barcode lookup

### Phase B5 — Hardening (Week 5)
- [ ] Per-user rate limiting (free vs premium)
- [ ] Input sanitization + security headers
- [ ] Retry logic for Gemini API failures
- [ ] Request logging + monitoring
- [ ] Deploy to Vercel / Render
- [ ] End-to-end test: frontend → backend → Gemini → response

---

## 16. Backend Verification Plan

### Automated Tests

```bash
# Run all backend tests
cd D:\scanandsee\server
npm test

# Or for Vercel structure:
cd D:\scanandsee
npm run test:api
```

**Test cases to write:**

| Test | File | What It Verifies |
|---|---|---|
| Health score calculation | `tests/score.test.js` | Score formula produces correct 0-10 values for known inputs |
| Zod schema validation | `tests/schema.test.js` | Valid Gemini JSON passes, malformed JSON rejects |
| Image processing | `tests/image.test.js` | sharp resizes to max 1024px, output is JPEG |
| Auth middleware | `tests/auth.test.js` | Rejects missing/invalid tokens, passes valid tokens |
| Rate limiter | `tests/rateLimit.test.js` | Blocks after limit reached |

### Manual API Testing (with cURL)

```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Analyze food (with auth token from Firebase)
curl -X POST http://localhost:3001/api/scan/analyze \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -F "image=@test-food.jpg" \
  -F "gymMode=true"

# 3. Get scan history
curl http://localhost:3001/api/scan/history \
  -H "Authorization: Bearer YOUR_ID_TOKEN"

# 4. Search nutrition database
curl "http://localhost:3001/api/nutrition/search?query=chicken+breast" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"

# 5. Barcode lookup
curl http://localhost:3001/api/barcode/5000159484695 \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

### Integration Test Checklist

- [ ] Frontend uploads image → backend receives + processes → Gemini responds → client shows results
- [ ] Auth flow: Google sign-in → token sent → backend verifies → profile loaded
- [ ] Scan saved to Firestore → appears in history page on refresh
- [ ] Rate limit triggered after 5 scans → shows upgrade prompt
- [ ] Barcode scan → Open Food Facts responds → nutrition displayed
- [ ] Daily log updates correctly after each scan
- [ ] Error states: invalid image format, Gemini timeout, no internet

---

> [!IMPORTANT]
> **For any agent picking this up:** The backend and frontend are tightly coupled through the API contracts in Section 5. Build the backend routes first, test with cURL, then wire up the frontend `fetch` calls. The Vercel serverless approach (Option A) is recommended — everything deploys as one project.
