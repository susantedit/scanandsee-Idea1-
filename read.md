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
# ScanAndSee — Design System Reference: Cyber-Vitality

> Quick-reference file for the Cyber-Vitality design system. Import this as CSS custom properties.

---

## CSS Custom Properties (copy into `variables.css`)

```css
:root {
  /* ═══════════════════════════════════════════════
     CYBER-VITALITY DESIGN SYSTEM
     ScanAndSee — AI Nutrition Assistant
     ═══════════════════════════════════════════════ */

  /* ── Foundation ────────────────────────────── */
  --color-background:         #131315;
  --color-surface:            #131315;
  --color-surface-dim:        #131315;
  --color-surface-bright:     #39393b;
  --color-surface-lowest:     #0e0e10;
  --color-surface-low:        #1c1b1d;
  --color-surface-container:  #201f21;
  --color-surface-high:       #2a2a2c;
  --color-surface-highest:    #353437;
  --color-surface-variant:    #353437;
  --color-void:               #050505;

  /* ── Text ──────────────────────────────────── */
  --color-on-surface:         #e5e1e4;
  --color-on-surface-variant: #b9ccb2;
  --color-inverse-surface:    #e5e1e4;
  --color-inverse-on-surface: #313032;

  /* ── Borders ───────────────────────────────── */
  --color-outline:            #84967e;
  --color-outline-variant:    #3b4b37;
  --color-surface-tint:       #00e639;
  --color-glass-border:       rgba(255, 255, 255, 0.15);

  /* ── Primary — Electric Green ──────────────── */
  --color-primary:              #ebffe2;
  --color-on-primary:           #003907;
  --color-primary-container:    #00ff41;
  --color-on-primary-container: #007117;
  --color-inverse-primary:      #006e16;
  --color-primary-fixed:        #72ff70;
  --color-primary-fixed-dim:    #00e639;

  /* ── Secondary — Cyber Cyan ────────────────── */
  --color-secondary:              #d3fbff;
  --color-on-secondary:           #00363a;
  --color-secondary-container:    #00eefc;
  --color-on-secondary-container: #00686f;
  --color-secondary-fixed:        #7df4ff;
  --color-secondary-fixed-dim:    #00dbe9;

  /* ── Tertiary — Neon Magenta ───────────────── */
  --color-tertiary:              #fff7f9;
  --color-on-tertiary:           #5e0053;
  --color-tertiary-container:    #ffcfee;
  --color-on-tertiary-container: #b1009f;
  --color-tertiary-fixed:        #ffd7f0;
  --color-tertiary-fixed-dim:    #fface8;

  /* ── Error ─────────────────────────────────── */
  --color-error:              #ffb4ab;
  --color-on-error:           #690005;
  --color-error-container:    #93000a;
  --color-on-error-container: #ffdad6;

  /* ── Glows ─────────────────────────────────── */
  --glow-primary:   0 0 8px rgba(0, 255, 65, 0.5);
  --glow-secondary: 0 0 8px rgba(0, 238, 252, 0.5);
  --glow-tertiary:  0 0 8px rgba(255, 172, 232, 0.5);
  --glow-error:     0 0 8px rgba(255, 180, 171, 0.5);
  --glow-primary-lg:   0 0 15px rgba(0, 255, 65, 0.6);
  --glow-secondary-lg: 0 0 15px rgba(0, 238, 252, 0.6);

  /* ── Typography ────────────────────────────── */
  --font-display:  'Sora', sans-serif;
  --font-body:     'Hanken Grotesk', sans-serif;
  --font-mono:     'Space Mono', monospace;

  /* ── Border Radius ─────────────────────────── */
  --radius-sm:   2px;
  --radius:      4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-full: 9999px;

  /* ── Spacing ───────────────────────────────── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;
  --gutter:         16px;
  --margin-mobile:  20px;
  --margin-desktop: 40px;
  --container-max:  1280px;

  /* ── Glass Properties ──────────────────────── */
  --glass-bg:     rgba(32, 31, 33, 0.4);
  --glass-blur:   20px;
  --glass-border: 1px solid rgba(255, 255, 255, 0.15);

  /* ── Transitions ───────────────────────────── */
  --transition-default: 300ms ease-out;
  --transition-fast:    200ms ease;
  --transition-spring:  400ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ── Z-Index Scale ─────────────────────────── */
  --z-base:     1;
  --z-mid:      10;
  --z-top:      100;
  --z-overlay:  500;
  --z-modal:    1000;
  --z-holo:     9999;
}
```

---

## Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;500;700&display=swap');
```

---

## Utility Classes

```css
/* Glassmorphism */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--radius-xl);
}

/* Glow effects */
.glow-primary   { box-shadow: var(--glow-primary); }
.glow-secondary { box-shadow: var(--glow-secondary); }
.glow-tertiary  { box-shadow: var(--glow-tertiary); }
.glow-error     { box-shadow: var(--glow-error); }

/* Clipped-corner button */
.clip-btn {
  clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
}

/* Typography */
.text-display   { font-family: var(--font-display); font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: 0.05em; }
.text-headline  { font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.2; letter-spacing: 0.02em; }
.text-body      { font-family: var(--font-body);    font-size: 16px; font-weight: 400; line-height: 1.6; letter-spacing: 0.01em; }
.text-label     { font-family: var(--font-mono);    font-size: 12px; font-weight: 500; line-height: 1.4; letter-spacing: 0.1em; text-transform: uppercase; }

/* Holographic overlay (apply to pseudo-elements) */
.holo-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 238, 252, 0.03) 2px,
    rgba(0, 238, 252, 0.03) 4px
  );
  pointer-events: none;
  z-index: var(--z-holo);
}
```

---

## Icon Library

Use **Lucide React** (`lucide-react` package). Key icons needed:

| Usage | Icon Name |
|---|---|
| Home | `Home` |
| Scan | `ScanLine` or `Camera` |
| History | `Clock` |
| Compare | `GitCompare` |
| Profile | `User` |
| Settings | `Settings` |
| Back | `ArrowLeft` |
| Flash | `Zap` |
| Gallery | `Image` |
| Play/Pause | `Play`, `Pause` |
| Microphone | `Mic` |
| Warning | `AlertTriangle` |
| Safe | `ShieldCheck` |
| Protein | `Dumbbell` |
| Heart | `Heart` |
| Share | `Share2` |
| Save | `Bookmark` |
| Trophy | `Trophy` |
| Fire/Calories | `Flame` |
| Brain | `Brain` |
| Moon/Sleep | `Moon` |
To make your website feel *human-made instead of AI-generated*, you need to remove the “perfect template + over-polished symmetry” look that most AI-style UIs accidentally create.

Right now your concept is strong, but this is where most futuristic apps fail: they look **too clean, too balanced, too predictable**.

Here’s how to fix it in a real, practical way:

---

# 1. Break Symmetry on Purpose (most important fix)

AI designs tend to be perfectly centered and evenly spaced.

Humans don’t design like that.

### Do this:

* Shift cards slightly off-grid (tiny offsets)
* Mix card sizes (not equal rectangles everywhere)
* Let one section “dominate” visually per screen
* Avoid perfectly centered layouts for everything

👉 Example:
Instead of:

```
[ Card ] [ Card ]
[ Card ] [ Card ]
```

Do:

```
[ BIG CARD ]
     [ small card ] [ small card ]
```

---

# 2. Add “Imperfect Human Layering”

Real apps feel messy in a controlled way.

### Add:

* Slight overlapping cards
* Random depth variations (z-index variation)
* Uneven padding in sections (not breaking design, just subtle differences)

This removes the “Figma AI export” feeling.

---

# 3. Typography: Stop using only one style

AI UIs usually use one clean font everywhere.

### Fix:

Use 2–3 intentional contrasts:

* Big headers → futuristic / bold font
* Body → neutral readable font
* Accent text → monospace or tech font

Also:

* Mix font sizes more aggressively (not gradual scaling only)

---

# 4. Remove “Perfect Glassmorphism”

Glass UI is the biggest AI giveaway.

### Instead of:

* uniform blur everywhere
* same transparency everywhere

### Do:

* some panels more opaque than others
* some with grain texture
* some with slight noise overlay
* some with almost no blur

👉 Real premium UI always has **variation in materials**

---

# 5. Add Micro-“Human Details”

This is what makes it feel real.

### Add things like:

* Slight misalignment in icons (very subtle)
* Handwritten-style micro labels in some places
* Random “system thoughts” or AI logs like:

  * “Analyzing… still thinking about your last meal”
* Small playful imperfections:

  * “Protein: 42g (rounded… aggressively)”

These break the “robot-perfect UI” illusion.

---

# 6. Motion should NOT be too smooth

AI-generated interfaces often feel like everything is on easing curves 100% of the time.

### Fix:

* Mix easing types (fast + slow + snappy)
* Add occasional “jitter” or quick snap transitions
* Use abrupt transitions for Roast Mode or alerts

Humans don’t animate everything gently.

---

# 7. Add Real Content Chaos (very important)

Right now your concept sounds structured.

Real apps feel slightly chaotic.

### Add:

* inconsistent card lengths
* different content densities per section
* occasional “empty space tension”
* real-world variability (like actual user data would look messy)

---

# 8. Avoid Over-explaining UI

AI designs often label everything clearly.

### Instead:

* remove unnecessary labels
* let icons + context speak
* hide complexity behind interaction

Example:
Instead of:
“Nutrition Score: 82/100 (Excellent)”

Try:
“82 🔥” + hover reveals details

---

# 9. Make Roast Mode slightly unpredictable

If Roast Mode is too structured, it feels scripted.

### Add randomness:

* different tone intensity each time
* occasional “soft roast”
* occasional “silent judgment mode”
* rare easter egg messages

This makes it feel alive, not generated.

---

# 10. Add “System Personality Layer”

This is a pro trick.

Add a subtle AI “system presence”:

* background activity messages
* scanning logs
* memory hints

Example:

> “Remembering your last 3 meals… I have concerns.”

This creates personality depth.

---

# If you want the real truth:

Your current concept is already strong — the only risk is **over-designing it into perfection**.

The goal is:

> “Feels like a real product evolving over time, not a generated UI mockup.”

---

If you want, I can:

* redesign one of your screens (Home / Scan / Roast Mode) to feel *human-made*
* or give you a full “anti-AI UI design system” for your project
* or convert this into a frontend structure (React + Tailwind style rules)

Just tell me 👍
# ScanAndSee — AI Smart Nutrition Assistant
## Full Implementation Plan, Design System & Workflow Reference

> **Purpose:** This document is the single source of truth for building the ScanAndSee web application. It contains every requirement, design token, screen specification, animation behavior, architecture decision, and workflow step needed so that *any* developer or AI agent can pick up where the last one left off.

---

## Table of Contents
1. [Product Vision](#1-product-vision)
2. [Problems Solved](#2-problems-solved)
3. [Target Users](#3-target-users)
4. [Feature Requirements (MVP → V2 → V3)](#4-feature-requirements)
5. [Design System — Cyber-Vitality](#5-design-system--cyber-vitality)
6. [Screen-by-Screen Specification](#6-screen-by-screen-specification)
7. [Animation & Motion Spec](#7-aniamation--motion-spec)
8. [Architecture & Tech Stack](#8-architecture--tech-stack)
9. [Project File Structure](#9-project-file-structure)
10. [AI Pipeline Workflow](#10-ai-pipeline-workflow)
11. [API & Data Contracts](#11-api--data-contracts)
12. [Development Phases & Milestones](#12-development-phases--milestones)
13. [Verification Plan](#13-verification-plan)
14. [Revenue Model](#14-revenue-model)
15. [Key Design Principles](#15-key-design-principles)

---

## 1. Product Vision

> "Make understanding food as easy as taking a photo."

ScanAndSee is an **AI-powered nutrition intelligence platform** that turns any smartphone camera into an instant food analysis engine. Users scan or upload any food item—packaged products, restaurant meals, drinks, supplements, gym products—and receive a deep nutritional breakdown with voice-powered AI coaching in seconds.

It is **not** a calorie-tracking spreadsheet. It is an intelligent, visual, voice-driven health companion that feels like **"Jarvis for food."**

---

## 2. Problems Solved

| Problem | How ScanAndSee Solves It |
|---|---|
| Nutrition labels are confusing | AI explains ingredients in plain language via voice |
| Manual calorie tracking is tedious | One photo does everything—no typing |
| Gym users are confused about products | Dedicated Gym Mode with bulking/cutting/recovery analysis |
| Fake "healthy" marketing tricks consumers | AI Ingredient Danger Detection exposes harmful additives |
| Students need affordable healthy food | Budget Nutrition Optimizer builds meals on any budget |
| People don't know what they eat daily | AI Daily Diet Tracker with weekly health reports |

---

## 3. Target Users

- **Gym Users & Athletes** — protein quality, pre/post workout suitability
- **Students** — budget meals, cheap protein sources
- **Weight Loss Users** — calorie awareness, healthier swaps
- **Parents** — checking packaged foods for children
- **Diabetic Users** — sugar/sodium warnings, personalized advice
- **Fitness Creators** — shareable scan cards for social media
- **Busy Professionals** — instant analysis, no manual input

---

## 4. Feature Requirements

### Phase 1 — MVP (Build First)

| # | Feature | Description | Priority |
|---|---|---|---|
| F1 | **Camera Scan / Upload** | Upload photo or use device camera. Support food photos, packaged products, ingredient labels, meals. | 🔴 Critical |
| F2 | **AI Vision Analysis** | Gemini Vision API analyzes the image → identifies food, reads labels, estimates nutrition. | 🔴 Critical |
| F3 | **Nutrition Results Screen** | Display protein, calories, carbs, fats, sugar, sodium, fiber. Show overall Health Score (0–10) with animated ring. | 🔴 Critical |
| F4 | **AI Voice Explanation** | Text-to-speech explains analysis naturally: "This product contains high sodium…" Uses browser Web Speech API as default, ElevenLabs as premium. | 🔴 Critical |
| F5 | **Ingredient Danger Detection** | Flag harmful additives (palm oil, HFCS, excessive sodium). Show cancer risk, diabetes warning, heart health score. Provide safer alternatives. | 🔴 Critical |
| F6 | **Health Score System** | 0–10 composite score based on nutritional value, harmful ingredients, fitness suitability. Visual animated glowing ring. | 🔴 Critical |
| F7 | **Meal Improvement Suggestions** | AI suggests fixes: "Add eggs for protein", "Reduce seasoning packet by half." | 🟡 High |
| F8 | **Scan History** | Store recent scans with thumbnails, scores, and dates. Accessible from dashboard. | 🟡 High |

### Phase 2 — Enhanced Experience

| # | Feature | Description | Priority |
|---|---|---|---|
| F9 | **Gym Mode / Fitness Mode** | Toggle mode that evaluates food for: bulking, cutting, lean muscle, pre-workout, post-workout. Shows protein quality score, amino acid estimate, muscle recovery score. | 🟡 High |
| F10 | **AI Voice Personalities** | Selectable voices: Doctor, Gym Bro, Motivational Coach, Savage Roast, Anime Girl. Roast mode example: "Bro this snack has more sugar than your future." | 🟡 High |
| F11 | **Product Comparison** | Upload/scan 2 products side-by-side. AI compares: healthier option, cheaper nutrition, better protein, fewer chemicals. | 🟡 High |
| F12 | **"Can I Eat This?" Q&A** | Interactive chat: "Can diabetics eat this?", "Good for weight loss?", "Can I eat this at night?" | 🟡 High |
| F13 | **Daily Diet Tracker** | Track daily intake from scans. Show daily nutrition score, protein intake progress, calorie trends. | 🟡 High |
| F14 | **Personalized Goals** | Set goals: weight loss, muscle gain, bulking, cutting, diabetic-friendly, student budget. AI adapts all recommendations. | 🟡 High |
| F15 | **Barcode Scanner** | Scan product barcode → fetch nutrition from Open Food Facts / USDA APIs. | 🟢 Medium |
| F16 | **Shareable Result Cards** | Generate Instagram/TikTok-ready scan result cards with health score, macros, AI verdict. | 🟢 Medium |

### Phase 3 — Viral & Social

| # | Feature | Description | Priority |
|---|---|---|---|
| F17 | **Mood & Brain Analysis** | Predict energy crash risk, focus impact, sleep impact, mood effect from food. | 🟢 Medium |
| F18 | **AI Health Risk Prediction** | Predict long-term: obesity risk, diabetes pattern, protein deficiency trends. Visual charts. | 🟢 Medium |
| F19 | **Budget Nutrition Optimizer** | User enters daily budget (e.g., ₹300) → AI builds protein meals, grocery lists. | 🟢 Medium |
| F20 | **"Build My Plate" AI** | Scan available foods → AI creates optimized meal combination. | 🟢 Medium |
| F21 | **Smart Supplement Analyzer** | Deep analysis of whey, creatine, pre-workout: fake claims, protein quality, hidden ingredients, overdose risks. | 🟢 Medium |
| F22 | **Community & Leaderboards** | Users post scans, leaderboard: Healthiest Eater, Protein King. Gamification. | 🔵 Future |
| F23 | **Fake Product Detection** | AI checks for duplicate/fake supplements, expired items. Important for Nepal/India market. | 🔵 Future |
| F24 | **AI Grocery Cart Analysis** | Scan entire grocery cart → AI says: "too much sugar, low protein, missing fiber, healthier swaps." | 🔵 Future |
| F25 | **Restaurant Food Scanner** | Upload restaurant meal → estimate calories, oil, protein, unhealthy ingredients. | 🔵 Future |

---

## 5. Design System — Cyber-Vitality

### 5.1 Brand Personality

**"High-Performance Futurism"** — Elite athletic discipline meets cutting-edge digital aesthetics. Targets Gen Z gym enthusiasts who view nutrition as bio-hacking. The emotional response is empowerment, precision, and high energy—like stepping into a sci-fi cockpit HUD.

> [!IMPORTANT]
> The website must NOT look AI-generated. Use proper **icon libraries** (Lucide, Phosphor, or Heroicons) instead of emoji throughout the entire UI.

### 5.2 Color Palette

```yaml
# Foundation
background:        '#131315'   # Deep void canvas
surface:           '#131315'
surface-dim:       '#131315'
surface-bright:    '#39393b'
surface-container-lowest:  '#0e0e10'
surface-container-low:     '#1c1b1d'
surface-container:         '#201f21'
surface-container-high:    '#2a2a2c'
surface-container-highest: '#353437'

# Text
on-surface:          '#e5e1e4'
on-surface-variant:  '#b9ccb2'
inverse-surface:     '#e5e1e4'
inverse-on-surface:  '#313032'

# Borders
outline:          '#84967e'
outline-variant:  '#3b4b37'
surface-tint:     '#00e639'

# Primary — Electric Green (Vitality, Growth, Energy)
primary:              '#ebffe2'
on-primary:           '#003907'
primary-container:    '#00ff41'      # THE hero accent
on-primary-container: '#007117'
inverse-primary:      '#006e16'

# Secondary — Cyber Cyan (Data, AI Scanning, Tech)
secondary:              '#d3fbff'
on-secondary:           '#00363a'
secondary-container:    '#00eefc'
on-secondary-container: '#00686f'

# Tertiary — Neon Magenta (Alerts, Protein Highlights, Energy)
tertiary:              '#fff7f9'
on-tertiary:           '#5e0053'
tertiary-container:    '#ffcfee'
on-tertiary-container: '#b1009f'

# Semantic
error:              '#ffb4ab'
on-error:           '#690005'
error-container:    '#93000a'
on-error-container: '#ffdad6'

# Fixed Variants
primary-fixed:             '#72ff70'
primary-fixed-dim:         '#00e639'
secondary-fixed:           '#7df4ff'
secondary-fixed-dim:       '#00dbe9'
tertiary-fixed:            '#ffd7f0'
tertiary-fixed-dim:        '#fface8'
```

#### Glow Effect Rule
All accent-colored elements must use a **4–8px box-shadow blur** of the same hue at 40–60% opacity to simulate light emission:
```css
/* Example: Primary glow */
box-shadow: 0 0 8px rgba(0, 255, 65, 0.5);

/* Example: Cyan glow */
box-shadow: 0 0 8px rgba(0, 238, 252, 0.5);

/* Example: Magenta glow */
box-shadow: 0 0 8px rgba(255, 172, 232, 0.5);
```

### 5.3 Typography

| Token | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| `display-lg` | **Sora** | 48px | 800 | 1.1 | 0.05em | Hero headlines |
| `headline-lg` | **Sora** | 32px | 700 | 1.2 | 0.02em | Section titles |
| `headline-lg-mobile` | **Sora** | 24px | 700 | 1.2 | — | Mobile section titles |
| `body-md` | **Hanken Grotesk** | 16px | 400 | 1.6 | 0.01em | Body copy, descriptions |
| `label-tech` | **Space Mono** | 12px | 500 | 1.4 | 0.1em | Data labels, scanning readouts, timestamps |

**Google Fonts import:**
```
Sora:wght@400;700;800
Hanken+Grotesk:wght@400;500;600;700
Space+Mono:wght@400;500;700
```

### 5.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 2px | Tiny inputs |
| `rounded` | 4px | **Primary radius** — sharp, precision-machined |
| `rounded-md` | 6px | Small cards |
| `rounded-lg` | 8px | Medium containers |
| `rounded-xl` | 12px | **Container radius** — frosted glass cards |
| `rounded-full` | 9999px | Pills, chips, avatars |

### 5.5 Spacing System

Based on **4px increments**: `4, 8, 12, 16, 20, 24, 32, 48, 64`

| Token | Value |
|---|---|
| `gutter` | 16px |
| `margin-mobile` | 20px |
| `margin-desktop` | 40px |
| `container-max` | 1280px |

### 5.6 Layout — Fluid HUD Grid

- **Desktop:** 12-column grid, 40px margins, 16px gutter
- **Mobile:** 4-column grid, 20px margins, 16px gutter
- **HUD Constraints:** Key metrics (Calories, Macros) anchored to peripheral corners or in concentric rings to simulate visor field-of-view
- **Background void framing:** On mobile, glass modules stack vertically with 20px side margins so the dark background "frames" each module

### 5.7 Elevation & Depth (4-Layer System)

| Layer | Description | CSS Properties |
|---|---|---|
| **1. Base** | Deepest background `#050505` | Subtle moving mesh gradients of Cyan + Magenta at 10% opacity |
| **2. Mid (Glass)** | Semi-transparent surfaces | `backdrop-filter: blur(20px); background: rgba(32,31,33,0.4); border: 1px solid rgba(255,255,255,0.15);` |
| **3. Top (Interactive)** | Active/focused elements | `border: 1.5px solid <accent>; box-shadow: 0 0 12px <accent-glow>;` |
| **4. Holographic Overlay** | Non-interactive scan lines, grid patterns | `z-index: highest; opacity: 0.05–0.10; pointer-events: none;` |

### 5.8 Component Specifications

#### Buttons (Clipped Corner)
```css
.btn-primary {
  background: linear-gradient(135deg, #00e639, #00ff41);
  color: #003907;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 12px 24px;
  border: none;
  clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}
.btn-primary:hover {
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.6);
  transform: translateY(-1px);
}
```

#### Glass Cards
```css
.glass-card {
  background: rgba(32, 31, 33, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 24px;
}
```

#### Glowing Progress Rings
- Multi-layered concentric SVG circles
- Background track: `#353437`
- Progress stroke: gradient from Cyan (`#00eefc`) → Green (`#00e639`)
- Animated stroke-dashoffset on mount
- Inner text: health score number in `display-lg` Sora + glow

#### Scanning Input
```css
.scan-input {
  background: transparent;
  border: none;
  border-bottom: 2px solid #3b4b37;
  color: #e5e1e4;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 16px;
  padding: 12px 0;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.scan-input:focus {
  border-bottom-color: #00eefc;
  box-shadow: 0 2px 8px rgba(0, 238, 252, 0.3);
  outline: none;
}
/* Small "scanning..." animation in corner */
.scan-input::after {
  content: 'scanning...';
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: #00eefc;
  animation: blink 1.2s steps(2) infinite;
}
```

#### Nutrient Chips
```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.05em;
}
.chip--protein {
  background: rgba(255, 172, 232, 0.15);
  color: #fface8;
}
.chip--healthy {
  background: rgba(0, 230, 57, 0.15);
  color: #00e639;
}
.chip--warning {
  background: rgba(255, 180, 171, 0.15);
  color: #ffb4ab;
}
```

#### Holographic Slider
- Horizontal bar with dark track
- Vertical "laser" indicator line in Cyan
- Leaves a faint glowing trail as it moves (CSS gradient trailing effect)
- Thumb: thin vertical line with `box-shadow: 0 0 6px #00eefc`

---

## 6. Screen-by-Screen Specification

### Screen 1: Splash / Loading
- Full-screen dark void (`#050505`)
- App logo "ScanAndSee" in `display-lg` Sora, Electric Green
- Particle animation behind logo (green + cyan particles floating)
- Loading bar: holographic slider style
- Transition: fade + scale into Home screen

### Screen 2: Onboarding (First-Time Only)
- 3 slides:
  1. "Scan Any Food" — camera icon + holographic scan beam animation
  2. "Instant AI Analysis" — animated health score ring filling up
  3. "Your AI Nutrition Coach" — voice waveform animation
- Glass card containers with pagination dots
- Skip button (label-tech style)
- "Get Started" button (clipped corner primary)

### Screen 3: Goal & AI Persona Setup
- Header: "Configure Your AI" in headline-lg
- **Goal selector:** Grid of glass cards with icons (not emoji):
  - Weight Loss, Muscle Gain, Bulking, Cutting, Healthy Eating, Diabetic-Friendly, Student Budget
  - Selected state: neon green border + glow
- **AI Voice Personality selector:** Horizontal scrolling chips:
  - Doctor, Gym Bro, Motivational Coach, Savage Roast
  - Each has an icon and preview play button
- **Profile inputs:** Age, Weight, Activity Level (scanning inputs)
- Continue button (clipped corner)

### Screen 4: Home / Dashboard
- **Top bar:** Logo left, profile avatar right, settings gear icon
- **Hero section:** "Ready to Scan" with large pulsing scan button (center)
  - Concentric circular rings around the button that pulse outward
  - Glass card background
- **Quick stats row:** 3 glass mini-cards showing today's:
  - Calories consumed (number + mini progress ring)
  - Protein intake (grams + bar)
  - Health score average (number + glow)
- **Recent Scans:** Horizontal scroll of glass cards with:
  - Food thumbnail
  - Health score badge (colored by score)
  - Name + time since scan (label-tech)
- **Bottom navigation bar:** 5 items with Lucide icons:
  - Home, Scan (center/enlarged), History, Compare, Profile

### Screen 5: Camera Scan Screen
- Full-screen camera viewfinder
- **Holographic scan overlay:**
  - Animated corner brackets (green) that pulse
  - Horizontal scan beam (cyan gradient) that sweeps vertically
  - Grid pattern overlay at 5% opacity
- **Top bar:** Back arrow, flash toggle, gallery upload button
- **Bottom:** Large capture button (outer ring green glow, inner white circle)
- **Detection state:** When food detected:
  - Corner brackets snap to detected region
  - "ANALYZING..." text in label-tech (cyan, blinking)
  - Particle burst animation
- **Upload alternative:** Drag & drop zone with dashed cyan border
- After capture: animated transition to Results screen (scan beam → data reveal)

### Screen 6: AI Analysis / Results Screen
- **Health Score Hero:** Large centered glowing progress ring
  - Score number inside (display-lg)
  - Color-coded: 0–3 Red, 4–6 Yellow-Orange, 7–10 Green
  - Ring fills with animated stroke-dashoffset
  - Text verdict below: "HEALTHY", "MODERATE", "UNHEALTHY" in label-tech
- **AI Voice Section:**
  - Voice waveform visualizer bar (animated bars)
  - Play/Pause button
  - AI personality badge (e.g., "Gym Bro" chip)
  - Text transcript in glass card
- **Macros Breakdown:** Row of 4 mini glass cards:
  - Protein (magenta accent)
  - Carbs (cyan accent)
  - Fats (yellow accent)
  - Calories (green accent)
  - Each shows: gram value, daily % ring, label
- **Ingredient Analysis:**
  - List of detected ingredients
  - Each flagged ingredient has colored left-border:
    - Green = safe
    - Yellow = moderate
    - Red = dangerous
  - Expandable detail: side effect, alternative suggestion
- **Danger Alerts Section:**
  - Red-bordered glass cards for each warning
  - Icon (Lucide AlertTriangle) + warning text + risk type chip
  - E.g., "High Fructose Corn Syrup — Diabetes Risk"
- **Meal Improvement Card:**
  - Glass card with "How to Improve This Meal"
  - Bullet list of AI suggestions with green check icons
- **Fitness Assessment** (if Gym Mode on):
  - Glass card: "Good for Bulking?", "Pre-Workout?", "Post-Workout?"
  - Each with thumbs-up/down icon and short explanation
  - Protein quality score progress bar
  - Muscle recovery score progress bar
- **Actions Row:**
  - "Save Scan" button
  - "Share" button → generates shareable result card
  - "Compare" button → goes to comparison screen
  - "Ask AI" button → opens Q&A chat

### Screen 7: Product Comparison
- Split-screen layout (side-by-side on desktop, stacked on mobile)
- Each side: food image + macros + health score ring
- **Comparison table** in center:
  - Rows: Protein, Calories, Sugar, Sodium, Additives, Health Score
  - Winning value highlighted in green, losing in red
  - Overall winner banner at top with trophy icon
- Add product buttons on each side (camera or gallery)
- AI verdict card at bottom: "Product A is healthier because..."

### Screen 8: History / Diet Tracker
- **Daily summary card** at top:
  - Total calories, protein, carbs, fats as progress bars
  - Daily nutrition score (progress ring)
- **Calendar strip** (horizontal scroll, current day highlighted green)
- **Scan feed:** Vertical list of past scans
  - Each: thumbnail, food name, health score badge, time
  - Swipe actions: delete, reshare
- **Weekly Report CTA:** "View Weekly Health Report" button
  - Opens modal with charts: calorie trends, protein intake, eating patterns
  - Data visualized with neon-colored line charts on dark backgrounds

### Screen 9: AI Chat / Q&A
- Chat-style interface
- User messages: right-aligned, glass card, white text
- AI messages: left-aligned, glass card with green left border
- Suggested questions as chips at bottom:
  - "Can diabetics eat this?"
  - "Good for weight loss?"
  - "Can I eat this at night?"
- Typing indicator: three dots with pulse animation
- Voice input button with microphone icon

### Screen 10: Profile & Settings
- Profile card: avatar, name, goal badge, current AI persona
- Stats overview: total scans, average health score, streak
- Settings list (glass card sections):
  - Change Goal
  - Change AI Voice
  - Notification preferences
  - Units (metric/imperial)
  - Theme (auto/dark/light — default dark)
  - About / Credits
- Logout button (outline style)

---

## 7. Animation & Motion Spec

### Global Principles
- All transitions: **300ms ease-out** default
- Use `will-change` for animated properties
- Prefer CSS transforms + opacity for GPU-accelerated animations
- No animation should block interaction for more than 500ms
- Respect `prefers-reduced-motion`

### Specific Animations

| Element | Animation | Duration | Easing | Details |
|---|---|---|---|---|
| **Scan Button Pulse** | Scale + opacity ring | 2s loop | ease-in-out | Concentric rings scale 1→1.5 while fading out |
| **Scan Beam** | translateY sweep | 2.5s loop | linear | Cyan gradient line sweeps vertically across viewfinder |
| **Corner Brackets** | Snap to target | 400ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Overshoot spring effect when food detected |
| **Health Score Ring** | stroke-dashoffset | 1.5s | ease-out | Ring fills from 0 to target score on mount |
| **Particle Burst** | Radial scatter | 800ms | ease-out | 12–16 small dots scatter from center on scan complete |
| **Voice Waveform** | Bar height oscillation | continuous | per-bar random | 8–12 bars oscillating while audio plays, smooth random heights |
| **Glass Card Entry** | fadeIn + translateY(20px→0) | 400ms stagger | ease-out | Cards enter sequentially with 80ms stagger |
| **Page Transitions** | fadeIn + scale(0.98→1) | 300ms | ease-out | Subtle scale-up on page enter |
| **Macro Value Count** | Number counter | 1s | ease-out | Values count up from 0 to actual number |
| **Chip Hover** | Scale(1.05) + glow | 200ms | ease | Slight grow + box-shadow glow appears |
| **Danger Alert Pulse** | Border glow pulse | 2s loop | ease-in-out | Red border glow intensity oscillates |
| **Background Mesh** | Slow drift | 20s loop | linear | Subtle cyan/magenta radial gradients slowly drift position |
| **Scanning Text** | Blink | 1.2s steps(2) | — | "SCANNING..." text blinks in label-tech |
| **Loading Skeleton** | Shimmer gradient | 1.5s loop | linear | Light streak moves across placeholder areas |

---

## 8. Architecture & Tech Stack

### Frontend (Web — Vite + React)
| Layer | Technology | Why |
|---|---|---|
| Framework | **Vite + React 19** | Fast dev, HMR, modern bundling |
| Routing | **React Router v7** | Client-side navigation |
| Styling | **Vanilla CSS** with CSS custom properties | Full control over Cyber-Vitality system |
| Icons | **Lucide React** | Clean, consistent, no emoji |
| Animations | **CSS animations + Framer Motion** | GPU-accelerated, declarative |
| Camera | **react-webcam** + `getUserMedia` API | Camera access |
| Charts | **Recharts** or custom SVG | Nutrition data visualization |
| State | **Zustand** | Lightweight global state |
| Voice (TTS) | **Web Speech API** (free) / ElevenLabs API (premium) | Voice assistant |
| Voice (STT) | **Web Speech Recognition API** | Voice input for Q&A |

### Backend / APIs
| Service | Technology | Why |
|---|---|---|
| AI Vision | **Google Gemini 2.0 Flash** (Vision) | Free tier, best multimodal, reads food + labels |
| Nutrition Data | **USDA FoodData Central API** (free) | USDA nutrition database |
| Barcode Lookup | **Open Food Facts API** (free) | Global barcode → nutrition |
| Authentication | **Firebase Auth** (free tier) | Google/Email sign-in |
| Database | **Firebase Firestore** (free tier) | User data, scan history, goals |
| File Storage | **Firebase Storage** (free tier) | Scanned images |
| Hosting | **Vercel** (free tier) | Static + serverless functions |
| Analytics | **Firebase Analytics** (free) | Usage tracking |

> [!NOTE]
> All services chosen have **free tiers that require no credit card**.

### AI Prompt Architecture
The Gemini API call should use a structured prompt that returns JSON:

```
You are a nutrition analysis AI. Analyze this food image and return JSON:
{
  "food_name": "string",
  "health_score": 0-10,
  "verdict": "HEALTHY|MODERATE|UNHEALTHY",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "fiber_g": number,
  "ingredients": [{"name":"string", "safety":"safe|moderate|dangerous", "side_effect":"string", "alternative":"string"}],
  "warnings": [{"text":"string", "risk_type":"diabetes|heart|obesity|cancer|allergy"}],
  "improvements": ["string"],
  "gym_assessment": {
    "good_for_bulking": bool,
    "good_for_cutting": bool,
    "pre_workout": bool,
    "post_workout": bool,
    "protein_quality_score": 0-10,
    "muscle_recovery_score": 0-10
  },
  "voice_explanation": "string (natural conversational explanation)"
}
```

---

## 9. Project File Structure

```
D:\scanandsee\
├── index.html
├── package.json
├── vite.config.js
├── .env                          # API keys (gitignored)
├── .env.example                  # Template
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Router + layout
│   ├── index.css                 # Global styles + CSS vars (Cyber-Vitality)
│   │
│   ├── styles/
│   │   ├── variables.css         # All design tokens as CSS custom props
│   │   ├── typography.css        # Font imports + type scale
│   │   ├── animations.css        # All keyframe animations
│   │   ├── components.css        # Shared component styles
│   │   └── utilities.css         # Glow, glass, chip utilities
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx        # Top nav bar
│   │   │   ├── BottomNav.jsx     # Mobile bottom navigation
│   │   │   └── GlassCard.jsx     # Reusable glass card
│   │   ├── ui/
│   │   │   ├── Button.jsx        # Clipped-corner button
│   │   │   ├── Chip.jsx          # Nutrient chips
│   │   │   ├── ProgressRing.jsx  # SVG health score ring
│   │   │   ├── MacroCard.jsx     # Individual macro display card
│   │   │   ├── ScanInput.jsx     # Scanning-style input field
│   │   │   ├── VoiceWaveform.jsx # Audio visualizer bars
│   │   │   ├── ParticleBurst.jsx # Particle animation component
│   │   │   ├── HoloSlider.jsx    # Holographic slider
│   │   │   └── DangerAlert.jsx   # Red warning card
│   │   ├── scan/
│   │   │   ├── CameraView.jsx    # Camera + holographic overlay
│   │   │   ├── ScanOverlay.jsx   # Corner brackets + scan beam
│   │   │   └── UploadZone.jsx    # Drag & drop upload
│   │   ├── results/
│   │   │   ├── HealthScoreHero.jsx
│   │   │   ├── MacroBreakdown.jsx
│   │   │   ├── IngredientList.jsx
│   │   │   ├── MealImprovement.jsx
│   │   │   ├── FitnessAssessment.jsx
│   │   │   └── ShareCard.jsx
│   │   ├── comparison/
│   │   │   ├── ComparisonView.jsx
│   │   │   └── ComparisonTable.jsx
│   │   └── chat/
│   │       ├── ChatInterface.jsx
│   │       └── SuggestedChips.jsx
│   │
│   ├── pages/
│   │   ├── SplashPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── SetupPage.jsx         # Goal + AI persona
│   │   ├── HomePage.jsx          # Dashboard
│   │   ├── ScanPage.jsx          # Camera scan
│   │   ├── ResultsPage.jsx       # Analysis results
│   │   ├── ComparisonPage.jsx    # Product comparison
│   │   ├── HistoryPage.jsx       # Scan history + diet tracker
│   │   ├── ChatPage.jsx          # AI Q&A
│   │   └── ProfilePage.jsx       # Settings
│   │
│   ├── hooks/
│   │   ├── useCamera.js          # Camera access hook
│   │   ├── useVoice.js           # TTS playback hook
│   │   ├── useSpeechRecognition.js
│   │   └── useAnimateValue.js    # Number counter animation
│   │
│   ├── services/
│   │   ├── gemini.js             # Gemini Vision API calls
│   │   ├── nutrition.js          # USDA + Open Food Facts API
│   │   ├── firebase.js           # Firebase init + auth + firestore
│   │   └── voice.js              # TTS service (Web Speech / ElevenLabs)
│   │
│   ├── store/
│   │   ├── useAppStore.js        # Zustand store: user, goals, scans
│   │   └── useThemeStore.js      # Theme preferences
│   │
│   └── utils/
│       ├── scoreColor.js         # Score → color mapping
│       ├── formatNutrition.js    # Number formatting
│       └── shareCard.js          # Canvas-based shareable card gen
```

---

## 10. AI Pipeline Workflow

```mermaid
flowchart TD
    A[User Opens App] --> B{First Time?}
    B -->|Yes| C[Onboarding 3 Slides]
    C --> D[Goal & AI Persona Setup]
    D --> E[Home Dashboard]
    B -->|No| E
    E --> F[Tap Scan Button]
    F --> G[Camera Opens with HUD Overlay]
    G --> H{Capture or Upload}
    H -->|Camera| I[Take Photo]
    H -->|Upload| J[Select from Gallery]
    I --> K[Image Sent to Gemini Vision API]
    J --> K
    K --> L[AI Analyzes: Food, Labels, Ingredients]
    L --> M[Nutrition APIs Fetch Supplementary Data]
    M --> N[Calculate Health Score 0-10]
    N --> O[Generate Voice Explanation]
    O --> P[Display Results Screen]
    P --> Q{User Action}
    Q -->|Save| R[Store to Firestore + History]
    Q -->|Share| S[Generate Shareable Card]
    Q -->|Compare| T[Open Comparison View]
    Q -->|Ask AI| U[Open Chat Interface]
    Q -->|Back| E
```

---

## 11. API & Data Contracts

### Gemini Vision Request
```javascript
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [
        { text: NUTRITION_ANALYSIS_PROMPT },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    }],
    generationConfig: { responseMimeType: 'application/json' }
  })
});
```

### Firestore Schema
```
users/
  {uid}/
    profile: { name, age, weight, activityLevel, goal, aiPersona, createdAt }
    scans/
      {scanId}: { imageUrl, foodName, healthScore, macros, ingredients, warnings, improvements, gymAssessment, voiceExplanation, createdAt }
    dailyLog/
      {YYYY-MM-DD}: { totalCalories, totalProtein, totalCarbs, totalFats, scansCount, nutritionScore }
```

### USDA FoodData Central
```
GET https://api.nal.usda.gov/fdc/v1/foods/search?query={food_name}&api_key={key}
```

### Open Food Facts (Barcode)
```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

---

## 12. Development Phases & Milestones

### Phase 1 — Foundation (Week 1–2)
- [ ] Vite + React project setup
- [ ] CSS design system implementation (all tokens from Section 5)
- [ ] Core UI components: Button, GlassCard, ProgressRing, Chip, ScanInput
- [ ] Page routing structure
- [ ] Splash screen + onboarding flow
- [ ] Goal & AI persona setup page

### Phase 2 — Core Scanning (Week 2–3)
- [ ] Camera integration with HUD overlay
- [ ] Image upload (gallery + drag & drop)
- [ ] Gemini Vision API integration
- [ ] Results page with all sections
- [ ] Health score animation
- [ ] Voice AI (Web Speech API)
- [ ] Firebase Auth setup

### Phase 3 — Data & Tracking (Week 3–4)
- [ ] Firestore integration for scan storage
- [ ] Scan history page
- [ ] Daily diet tracker
- [ ] Home dashboard with live stats
- [ ] Weekly report generation

### Phase 4 — Enhanced Features (Week 4–5)
- [ ] Product comparison view
- [ ] AI Chat / Q&A interface
- [ ] Gym Mode toggle + fitness assessments
- [ ] AI voice personalities
- [ ] Barcode scanning (Open Food Facts)
- [ ] Shareable result cards

### Phase 5 — Polish & Launch (Week 5–6)
- [ ] All animations implemented and tested
- [ ] Responsive design verified (mobile + desktop)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] SEO meta tags
- [ ] PWA manifest + service worker
- [ ] Error handling + loading states
- [ ] Deploy to Vercel

---

## 13. Verification Plan

### Automated / Developer Testing
1. **Lint & Build Check:**
   ```bash
   cd D:\scanandsee
   npm run lint
   npm run build
   ```
   Must complete with 0 errors.

2. **Component Render Test:**
   Start dev server and verify each page loads without console errors:
   ```bash
   npm run dev
   ```
   Visit each route: `/`, `/onboarding`, `/setup`, `/home`, `/scan`, `/results`, `/comparison`, `/history`, `/chat`, `/profile`

3. **Responsive Check:**
   Use browser devtools to verify at breakpoints: 375px, 768px, 1024px, 1440px.

### Browser Testing (via browser tool)
1. Open dev server URL
2. Navigate through full user flow: Splash → Onboarding → Setup → Home → Scan → Results → History
3. Verify all animations play (scan beam, progress ring, particle burst)
4. Verify glass card blur effects render correctly
5. Verify voice playback triggers on Results page
6. Screenshot each page for visual verification

### Manual Verification (User)
1. **Camera Test:** Open on a real mobile device, test camera scanning with a real food product
2. **API Test:** Upload a food image and verify Gemini returns valid nutrition JSON
3. **Voice Test:** Confirm voice explanation plays with correct AI personality
4. **Share Test:** Generate and download a shareable result card
5. **Firebase Test:** Sign in, make a scan, verify it appears in scan history after refresh

---

## 14. Revenue Model

### Free Tier
- 5 scans per day
- Basic nutrition analysis
- Web Speech API voice
- Scan history (30 days)

### Premium Tier
- Unlimited scans
- Personalized AI coach with goal tracking
- Custom diet plans
- Advanced analytics & weekly reports
- Premium voice packs (ElevenLabs)
- Fitness/gym deep analysis
- Export nutrition reports as PDF
- Priority AI processing

---

## 15. Key Design Principles

1. **Speed First** — Scanning → Results must feel instant (target < 3 seconds perceived)
2. **Visual > Text** — Use progress rings, colored chips, and icons over paragraphs
3. **The UI Must Feel Alive** — Every element should have micro-interactions, glows, and motion
4. **No Emoji in UI** — Use Lucide or Phosphor icon library exclusively
5. **Mobile-First** — Design for 375px first, enhance for desktop
6. **Shareable by Default** — Every result should be one tap from social media
7. **Premium Dark Aesthetic** — The app should feel like a high-end gaming HUD, not a medical app
8. **Accessible Data** — Despite the sci-fi aesthetic, nutrition data must remain clear and legible
9. **Respect Reduced Motion** — Provide `prefers-reduced-motion` fallbacks for all animations
10. **Self-Documenting** — This plan is the contract. Any agent should be able to build from it.

---

> [!TIP]
> **For any AI agent picking this up:** Start with Phase 1. Build the CSS design system first (`variables.css`, `typography.css`, `animations.css`), then the reusable components, then assemble into pages. Everything you need is in this document.




idea  i have of unique i am just generting idea first idea  is when the user upload any thing and the app will check  analyze ythe products and gives is it  healthy or not also the guide how much protein will itget and also wil get a voice assistant explainiuing it do deep research and tell me what more idea could be added

Your idea is actually strong because it combines AI vision + nutrition + voice coaching + health assistant into one app. Most apps only do one part.
You can turn this into an AI-powered “Smart Food Scanner.”

Here’s how you can make it much more unique and addictive:

Core Idea
User uploads:

food photo

product packet

restaurant meal

grocery item

supplement

energy drink

AI analyzes:

healthy or unhealthy

protein/carbs/fats

calories

sugar level

preservatives

chemicals/additives

fitness score

gym suitability

weight gain/loss suitability

Then a voice assistant explains everything naturally.

Example:

“This product contains high sodium and artificial sugar. Good for quick energy but not ideal for daily consumption. Estimated protein: 18g.”

That alone is already startup-level.

Features You Should Add
1. AI Ingredient Danger Detection
This can become viral.

When user scans ingredients:

detects harmful additives

explains side effects

gives safer alternatives

Example:

“Contains Palm Oil”

“High Fructose Corn Syrup detected”

“Too much sodium”

Add:

cancer risk indicators

diabetes warnings

heart health score

People LOVE scary-but-helpful health insights.

2. Gym Mode / Fitness Mode
Special mode for gym users.

AI says:

good for bulking?

cutting?

lean muscle?

pre-workout?

post-workout?

Also:

protein quality score

amino acid estimate

muscle recovery score

This targets:

gym audience

athletes

fitness creators

Huge market.

3. Voice AI Nutrition Coach
This is the killer feature.

Instead of just text:

AI speaks naturally like:

“You should avoid eating this daily because the sodium level is high.”

Add:

male/female voices

motivational gym coach voice

funny roast mode

Example roast mode:

“Bro this snack has more sugar than your future.”

This makes the app shareable on TikTok/Reels.

4. Meal Improvement Suggestions
Instead of only saying unhealthy:

AI suggests fixes.

Example:

User uploads noodles.

AI says:

Add eggs for protein

Add vegetables for fiber

Reduce seasoning packet by half

This makes the app useful, not just judgmental.

5. AI Daily Diet Tracker
After scans:

AI learns user habits.

Then gives:

daily nutrition score

weekly health report

protein intake progress

calorie trends

Like Spotify Wrapped but for food.

6. Smart Camera Real-Time Scanner
Very futuristic feature.

Open camera → AI analyzes instantly live.

Overlay:

Protein: 22g

Sugar: High

Healthy Score: 6/10

Like AR nutrition vision.

This alone could go viral.

7. “Can I Eat This?” AI
User asks:

“Can diabetics eat this?”

“Can gym beginners eat this?”

“Good for weight loss?”

“Can I eat this at night?”

AI answers personally.

8. AI Food Comparison
User uploads 2 products.

AI compares:

healthier option

cheaper nutrition

better protein value

less chemicals

This becomes a shopping assistant too.

9. Mood + Brain Analysis
Very unique.

AI predicts:

energy crash risk

focus impact

sleep impact

mood effect

Example:

“This drink may cause energy spikes followed by fatigue.”

10. AI Personalized Diet Plan
Based on:

age

weight

goals

activity

budget

AI generates:

cheap protein foods

Nepali diet plans

vegetarian plans

student meal plans

Very valuable in Nepal/India market.

11. Community + Social Features
Users post scans.

Others react:

healthy

fake healthy

gym approved

cheat meal

Add leaderboard:

healthiest eater

protein king

sugar destroyer

Gamification increases retention massively.

12. Barcode Scanner
Scan product barcode instantly.

AI fetches:

nutrition

reviews

health score

alternatives

Fast and practical.

13. Fake Product Detection
Huge in Nepal/India.

AI checks:

duplicate products

fake supplements

fake whey protein

expired items

Very powerful niche feature.

14. Budget Nutrition Optimizer
Perfect for students.

User says:

“I have only Rs. 300/day.”

AI builds:

protein meals

healthy foods

cheap grocery list

This solves a real problem.

15. AI Voice Personalities
This can make your app famous.

Modes:

Doctor

Gym Bro

Anime Girl

Savage Roast

Motivational Coach

Nepali Uncle

Entertainment + utility = viral growth.

16. AI “Health Risk Future Prediction”
Advanced feature.

AI predicts:

obesity risk

diabetes pattern

protein deficiency

bad eating trends

Shown visually.

People love predictive insights.

17. Restaurant Food Scanner
Upload restaurant meal.

AI estimates:

calories

oil amount

protein

unhealthy ingredients

Could become huge for food vloggers.

18. “Build My Plate” AI
User scans available foods.

AI says:

combine this + this

remove this

add protein source

Creates optimized meal.

19. Smart Supplement Analyzer
Massive fitness niche.

Analyze:

whey protein

creatine

pre-workout

AI checks:

fake claims

protein quality

hidden ingredients

overdose risks

20. AI Grocery Shopping Assistant
User scans grocery cart.

AI says:

too much sugar

low protein

missing fiber

healthier swaps

Very practical real-world use.

Monetization Ideas
You could monetize with:

Premium AI coach

Personalized diet plans

Fitness partnerships

Gym sponsorships

Supplement affiliate links

Smart wearable integration

Nutrition reports PDF

AI voice packs

Best Tech Stack
For this idea:

Frontend:

React Native

Expo

AI Vision:

Google Gemini Vision

OpenAI Vision API

Nutrition APIs:

USDA FoodData Central

Nutritionix API

Voice:

ElevenLabs

Barcode:

Open Food Facts

Most Viral Feature Combination
If you want maximum growth:

Camera scan

AI roast voice

Health score

Gym mode

Before/after diet tracking

Shareable result card

That combination is extremely social-media friendly.

Strong App Name Ideas
NutriLens

ScanBite AI

EatWise

MacroMind
1
FitScan

NutriVision

CalorieX

HealthScope AI

BiteCheck

GymFuel AI

This idea genuinely has startup potential because it solves:

health awareness

gym nutrition

fake healthy marketing

diet confusion

food education

And it can go viral because scanning food is visual + emotional + shareable.


why up all ideas are good why should others use it why its unique than others answer it in short 

Your app is unique because most health apps only do tracking, but your app does understanding + explaining + guiding instantly from a simple photo.

What makes it different:

AI actually analyzes food visually instead of manual input

Gives real-time health insights instantly

Explains naturally with voice AI

Personalized for gym, weight loss, students, diabetics, etc.

Detects harmful ingredients and fake healthy products

Makes nutrition simple for normal people

Fun/social features like roast mode and shareable scans

Why people would use it:

Faster than typing calories manually

Helps users make smarter food choices instantly

Saves money by avoiding bad products

Useful for fitness and daily health

Easy enough for anyone to use with just a camera

Entertaining + educational at the same time

Most competitors are:

boring

manual

text-heavy

calorie-focused only

Your idea feels more like:

“ChatGPT + AI Vision + Nutrition Coach + Gym Assistant + Voice Companion” in one app.


acts as a example you are the founder gone for shark tank and sharks says why should i invest to this what would be best answer

“Most health apps fail because they expect users to manually enter everything. People don’t want spreadsheets for food — they want instant understanding.

Our app solves that with AI vision.

A user simply points their camera at any food or product, and within seconds the app analyzes ingredients, protein, calories, harmful additives, gym suitability, and even explains it with an AI voice coach.

But the real opportunity is bigger than calorie tracking.

We are building an AI health companion that makes nutrition simple, interactive, and personalized for everyone — students, gym users, parents, diabetics, and busy people.

What makes us different is:

visual AI analysis instead of manual tracking

voice-based health explanations

personalized recommendations

fake healthy product detection

social and viral sharing features

Health awareness is growing massively, but most people still don’t understand what they eat daily. We turn every phone camera into a smart nutrition expert.

And because users scan food multiple times a day, this creates extremely high engagement and retention.

We’re not just building another fitness app.
We’re building the operating system for food intelligence.”


its looking engaiging in pitch dont compare to others do explain of core idea and what problem it will solve

“Every day, millions of people eat food without truly understanding what they are putting into their bodies. Nutrition labels are confusing, ingredients are difficult to understand, and most people don’t know whether a product is actually healthy for them.

Our app solves this with one simple action: a camera scan.

A user uploads or scans any food item, meal, drink, or product, and our AI instantly analyzes it — breaking down protein, calories, sugar, additives, health risks, and overall nutritional value in a simple, human way.

But we go beyond numbers.

The app becomes a personal AI nutrition companion that explains food through voice, gives healthier suggestions, guides users toward their fitness or health goals, and helps them make smarter daily decisions without needing expert knowledge.

This solves real-world problems:

people struggling with unhealthy eating habits

gym users confused about nutrition

parents unsure about packaged foods

students trying to eat healthy on a budget

consumers being misled by “healthy” marketing

We are turning complex nutrition science into something instant, visual, and understandable for everyone.

Our vision is simple:
to make understanding food as easy as taking a photo.”


describe my idea forstich include all

“Imagine a world where people can understand everything about their food instantly with just a camera.

Our idea is an AI-powered smart nutrition assistant that allows users to scan or upload any food item, packaged product, drink, supplement, or meal, and instantly receive a complete analysis of what they are consuming.

The AI visually analyzes the product and provides:

protein, calories, carbs, fats, and sugar levels

ingredient breakdowns in simple language

harmful additives or unhealthy chemicals

overall health and nutrition score

whether the food is good for fitness, weight loss, muscle gain, or daily health

But the experience goes beyond simple data.

The app includes an intelligent voice assistant that naturally explains the food to users like a real nutrition coach. Instead of confusing labels and technical terms, users hear simple guidance about what the product does to the body and whether it fits their personal goals.

The platform also gives personalized recommendations and improvements. For example, if a meal lacks protein or contains too much sugar, the AI suggests healthier alternatives or ways to balance the meal.

Users can:

compare products side by side

scan restaurant meals

analyze supplements and gym products

track daily nutrition habits

receive personalized diet insights

detect fake “healthy” marketing claims

build smarter meals based on their goals and budget

The vision is to transform every smartphone camera into an intelligent health companion that makes nutrition easy, interactive, and understandable for everyone.

Instead of forcing users to manually track calories or read complicated labels, the app makes healthy decision-making instant, visual, and personalized.”


full explain i said fromthis tab conversipon

“Today, people eat food every single day without truly understanding what they are putting into their bodies. Nutrition labels are confusing, ingredients are difficult to understand, and most people don’t have the time or knowledge to analyze whether a product is actually healthy for them.

Our idea solves this problem by turning a smartphone camera into an AI-powered nutrition intelligence system.

The app allows users to scan or upload absolutely anything related to food — packaged products, restaurant meals, drinks, snacks, supplements, grocery items, gym products, or homemade meals. Once uploaded, the AI instantly analyzes the item visually and provides a deep nutritional breakdown in seconds.

The system can estimate:

protein

calories

carbohydrates

fats

sugar levels

sodium

fiber

preservatives

additives

overall health quality

But the experience goes far beyond showing numbers.

The app is designed to simplify nutrition for normal people using AI explanations and voice interaction.

Instead of forcing users to read complicated labels, the AI voice assistant naturally explains:

whether the food is healthy or unhealthy

how it affects the body

if it is suitable for muscle gain, weight loss, fitness, or daily health

what harmful ingredients are present

whether the product is genuinely healthy or just marketed as healthy

For example, if someone scans an energy drink, the AI could say:

“This drink provides quick energy but contains very high sugar and caffeine levels. It may cause energy crashes if consumed regularly.”

If someone scans instant noodles, the AI could explain:

low protein content

high sodium levels

ways to improve the meal by adding eggs or vegetables

The goal is not only to analyze food, but to guide users toward smarter eating decisions in a simple and understandable way.

The platform also introduces personalized intelligence.

Users can choose goals such as:

weight loss

muscle gain

bulking

cutting

healthy eating

diabetic-friendly diets

student budget nutrition

The AI then adapts recommendations based on those goals.

For gym users, the app becomes a fitness nutrition assistant. It can determine:

whether a product is good for pre-workout or post-workout

protein quality

muscle recovery value

lean muscle suitability

whether supplements contain suspicious ingredients

For students and budget users, the AI can recommend affordable high-protein alternatives and smarter grocery choices.

The app also includes product comparison features where users can compare two products side-by-side and instantly understand:

which is healthier

which contains more protein

which has fewer harmful ingredients

which provides better nutritional value for the price

Another major feature is ingredient danger detection.

The AI identifies harmful additives, excessive sugar, unhealthy oils, artificial chemicals, and misleading marketing claims. Many consumers buy products labeled as “healthy” without realizing what is actually inside them. The app exposes this information in a simple and visual way.

To make the experience engaging and highly shareable, the platform includes different AI voice personalities such as:

professional nutrition coach

gym trainer

motivational mode

funny roast mode

This creates both utility and entertainment, increasing engagement and social sharing potential.

The system can also track user habits over time.

By analyzing scans daily, the AI generates:

nutrition scores

protein intake tracking

eating pattern insights

weekly health summaries

progress reports

Future versions can even include:

live real-time camera scanning

AI grocery cart analysis

restaurant meal estimation

supplement authenticity detection

personalized meal building

health risk prediction trends

smart grocery recommendations

The vision behind the platform is very simple:

to make understanding food as easy as taking a photo.

We are transforming nutrition science from something complicated and inaccessible into something visual, intelligent, interactive, and available to everyone instantly through AI.”


now give me full things explaing from idea to tech stack workflow structure animations featueres all evrything that should be before starting as much as it make in any document file like pdf oor else workflow structure diiagrams do all in it everything should be paid service need to not use any credit card something

Download the complete AI Smart Nutrition Assistant Blueprint 


convert in md filke

Download the Markdown file 


This is a visionary concept for making nutrition intelligence accessible to everyone. To bring this to life, I've planned a mobile experience that prioritizes speed, clarity, and personalization.

I propose starting with these 5 core screens to establish the foundation of the platform:

AI Smart Scanner (Home): A high-performance camera interface for instant food scanning, featuring real-time visual overlays and quick-access goal shortcuts.
Nutritional Intelligence Report: A deep-dive analysis screen that transforms raw numbers into actionable advice, featuring a "Quick Health Score" and the AI Voice Assistant’s insights.
Product Comparison Engine: A side-by-side view to easily contrast two items, highlighting the healthier choice based on the user's specific goals.
Personalized Health Dashboard: A hub for tracking daily habits, protein intake, and progress toward goals like muscle gain or healthy eating.
AI Persona & Goals Setup: A configuration screen to select your primary nutrition goal (e.g., Diabetic-friendly, Student Budget) and your preferred AI voice personality.
Visual Direction: I recommend a "Clean Modern Vitality" aesthetic:

Palette: Fresh greens for health, deep navy for professional trust, and vibrant accent colors to highlight "danger" ingredients or "high-protein" wins.
Typography: A highly readable sans-serif that balances a medical-grade feel with friendly accessibility.
UI Style: Soft cards, intuitive data visualizations (progress rings, bar charts), and clear iconography for ingredient alerts.
Does this screen list and visual direction align with your vision, or would you like to adjust any of the core features before I begin the design? whats this in stich

That is basically Stitch acting like a professional UI/UX product designer and product strategist.

What it’s doing:

understanding your app idea

converting it into structured product planning

deciding the first important screens

defining app flow

suggesting branding/design direction

preparing before actual UI designing starts

It’s not coding yet.

It’s asking:

“Is this the final product direction before I start designing the UI?”

The response is actually good because it already understands:

your core idea

target audience

app structure

health-focused branding

user experience flow

But it’s still very “professional startup presentation” style.

For your app, you should push it more futuristic and viral.

You should tell Stitch things like:

make UI more futuristic AI style

add glassmorphism

add 3D floating elements

add holographic scanning animations

make scan experience feel cinematic

make voice assistant feel alive

focus on Gen Z + gym audience

create highly shareable result screens

use motion-heavy interactions

include AI personality system

add glowing nutrition score animations

make it feel like “Jarvis for food”

Because currently its direction is:

“clean medical health app”

But your concept is stronger as:

“futuristic AI nutrition companion”

That difference matters a lot visually.

You can reply something like:

The direction is good, but I want the experience to feel more futuristic, cinematic, and AI-driven instead of a traditional health app.

I want the UI to feel like an advanced AI nutrition companion for Gen Z, gym users, creators, and modern users.

Please focus on:

glassmorphism and futuristic UI

holographic scanning effects

animated AI assistant interactions

3D floating nutrition cards

cinematic scan animations

glowing health score visuals

highly shareable result screens

smooth motion-heavy transitions

modern dark theme with neon accents

AI voice companion feeling alive

The scanning experience should feel magical and instant, almost like users are using “Jarvis for food.”

I also want stronger focus on:

gym mode

roast/fun AI personalities

product comparison visuals

social sharing

real-time scan feedback

emotional engagement and retention

The app should feel premium, addictive, futuristic, and visually unforgettable while still keeping nutrition information easy to understand.

You’ve reached the Free limit for chats with data analysis
Upgrade now or wait until 8:12 PM to keep analyzing, or continue in a new chat.

New chat

Upgrade


App Idea
Idea: When the user uploads [an image], the app will check, analyze, research, and give whether it is healthy or not. It will give a full guide on how much protein it will get, with a voice assistant explaining about it.

Example:
"The product contains high sodium and artificial sugar. Good for quick energy but not ideal for daily consumption."

Features that can be added
Core Functionality
Detects harmful additives: Explains side effects and gives safer alternatives.

Goal-specific detection: Can detect if it's good for "bulking" or "cutting."

AI Learning: AI gets trained with daily data history and gives suggestions (e.g., "You should avoid eating this tomorrow; sodium level is high").

Meal Suggestions: Suggestions like adding eggs for protein or reducing the seasoning packet by half.

Daily Diet & Tracker: Learns habits, gives daily nutrition score, and stores weekly health reports of all things.

Smart Detect: Protein, sugar, etc.

Interactive & Personalized Features
Interactive Q&A: User can ask questions like "Can diabetics eat this?", "Can gym beginners eat this?"

Multiple Comparisons: Gives healthier options, cheaper alternatives, etc.

Mood Analyzer: Predicts energy crashes, risk-basis impact, sleep impact, and mood effects.

Personalized Plans: Plans according to age, weight goals, and activity levels.

Community Feature: Live feedback from others, contact healthy/gym experts, and add a leaderboard for "Most Healthy Person."

Scanning & Verification
Instant Scan: Scans products instantly and checks nutrition, reviews, and health scores + alternatives.

Fake Detection: Checks for duplicate/fake products and fake supplements (e.g., fake whey protein).

Budget Optimizer: User says "3000 budget," and it builds protein meals/food/cheap monthly grocery lists.

Auto Personalities: Switch according to user preference (e.g., Doctor, Gym Bro, Anime Girl, Funny, or Motivational Coach).

Predictive & Advanced Analysis
AI Risk Future Indicator: Predicts obesity risks, diabetes patterns, protein deficiency, and bad eating habits.

Restaurant Food Scanner: It estimates calories, oil amount, and protein in unhealthy ingredients.

Food Combination: Scans available food and says combine this and this, remove this etc.

Fitness Niche: Analyze why protein matters.

Grocery Cart Analysis: User scans grocery cart and it says: "Too much sugar, low protein, missing fiber, health swap."

















idea from techchnical 
# AI Smart Nutrition Assistant - Complete Startup Blueprint

## Introduction
This document contains the complete idea, startup vision, workflow, feature list, UI/UX direction, animations, tech stack, backend structure, AI pipeline, monetization, and free/no-credit-card tools required to build an AI-powered food and nutrition analysis application.

---

# 1. Core Idea

The app allows users to upload or scan any food item, packaged product, meal, supplement, or drink.

AI analyzes the image and instantly explains:

- Protein
- Calories
- Carbs
- Fats
- Sugar
- Harmful ingredients
- Additives
- Fitness suitability
- Health score
- Diet recommendations
- Voice AI explanation

The vision is to make understanding food as easy as taking a photo.

---

# 2. Problems Solved

- People do not understand nutrition labels
- Gym users are confused about products
- Fake healthy marketing tricks consumers
- Students need affordable healthy food guidance
- Users want instant answers instead of manual calorie tracking

---

# 3. Target Users

- Gym users
- Students
- Weight loss users
- Busy professionals
- Parents
- Diabetic users
- Fitness creators

---

# 4. Unique Features

## AI Food Analysis
- Visual recognition
- Nutrition estimation
- Ingredient detection

## Voice AI Assistant
- Natural explanation
- Multiple voice personalities
- Roast mode
- Gym coach mode

## Smart Detection
- Fake healthy products
- Harmful additives
- Sugar overload
- Sodium warnings

## Fitness Features
- Bulking mode
- Cutting mode
- Muscle recovery analysis
- Protein quality score

## Smart Shopping
- Product comparison
- Grocery cart analysis
- Budget meal suggestions

---

# 5. User Workflow

1. User opens app
2. User scans/uploads food
3. AI vision analyzes image
4. Nutrition APIs fetch data
5. AI calculates health score
6. AI voice explains results
7. User receives recommendations
8. Data stored in dashboard

---

# 6. Workflow Diagram

```text
Camera Scan
      ↓
AI Vision Analysis
      ↓
Ingredient Detection
      ↓
Nutrition Calculation
      ↓
Health Score Generation
      ↓
Voice Assistant Explanation
      ↓
User Dashboard & Tracking
```

---

# 7. UI/UX Ideas

## Design Style
- Glassmorphism
- Dark futuristic UI
- Smooth gradients
- Floating cards
- Neon glow effects

## Home Screen
- AI assistant avatar
- Scan button center focus
- Daily nutrition score
- Recent scans

## Scan Screen
- Animated scan beam
- Camera overlay
- Real-time detection boxes

## Results Screen
- Protein bars
- Health score circle
- AI insights cards
- Voice playback animation

---

# 8. Animation Ideas

- Camera pulse animation
- AI thinking animation
- Floating particles
- Smooth progress loaders
- Voice waveform effects
- Nutrition meter animations
- Haptic feedback interactions

---

# 9. Recommended Tech Stack

## Frontend
- React Native
- Expo

## Backend
- Firebase
- Supabase

## Database
- Firestore
- PostgreSQL

## AI APIs
- Gemini Vision API
- OpenAI Vision API

## Voice AI
- ElevenLabs
- Browser TTS fallback

## Authentication
- Firebase Auth
- Clerk

## Hosting
- Vercel
- Render
- Netlify

## Analytics
- Firebase Analytics
- PostHog

---

# 10. No Credit Card Free Services

## Completely Free Options
- Firebase Free Tier
- Supabase Free Tier
- Vercel Free Hosting
- Netlify Free Hosting
- Expo Free Plan
- Open Food Facts API
- USDA FoodData Central API
- Gemini Free API Credits

---

# 11. Suggested Folder Structure

```bash
/app
/components
/screens
/hooks
/services
/api
/utils
/assets
/animations
/voice
/ai
```

---

# 12. Important Pages

- Splash Screen
- Login Screen
- Home Screen
- Camera Scan Screen
- Result Screen
- AI Voice Assistant
- Nutrition History
- Goal Tracker
- Profile Screen
- Settings Screen

---

# 13. AI Logic Structure

## Step 1
User uploads image

## Step 2
AI detects:
- food
- ingredients
- labels
- nutrition

## Step 3
System calculates:
- calories
- macros
- health score

## Step 4
Voice AI generates explanation

## Step 5
Results stored in dashboard

---

# 14. Future Features

- Live AR food scanning
- AI grocery assistant
- Restaurant analysis
- Smart meal builder
- AI health prediction
- Supplement authenticity checker
- Smart wearable integration

---

# 15. Revenue Model

## Free Features
- Basic scans
- Nutrition tracking

## Premium Features
- Unlimited scans
- Personalized AI coach
- Diet plans
- Advanced analytics
- Voice packs
- Fitness insights

---

# 16. Viral Growth Features

- Roast mode AI
- Shareable scan cards
- Fitness challenges
- Daily health streaks
- AI reactions
- Before/after tracking

---

# 17. MVP Plan

## Phase 1
Build:
- camera scan
- nutrition results
- AI explanation

## Phase 2
Add:
- voice assistant
- tracking
- comparison tools

## Phase 3
Launch:
- social features
- gym mode
- viral sharing

---

# 18. Important Advice Before Starting

- Focus on speed first
- Keep scanning simple
- Build MVP before adding advanced features
- Prioritize user experience
- Optimize mobile performance
- Make results visually attractive

---

# 19. Final Vision

The goal is to build an AI-powered nutrition ecosystem that combines:

- computer vision
- health intelligence
- food education
- fitness coaching
- voice AI
- smart recommendations

into one futuristic platform that makes understanding food instant, visual, and accessible to everyone.
insure all things are implemented and documented on readme file 