# ScanAndSee — Deployment Guide

## Backend → Render.com (free)

### 1. Push to GitHub
```bash
git add .
git commit -m "production ready"
git push origin main
```

### 2. Create Render service
1. Go to **dashboard.render.com** → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Node version:** 20

### 3. Add environment variables
Go to Environment tab and add ALL variables from `backend/.env.production.example`.

**Important for FIREBASE_PRIVATE_KEY:**
- Copy the key exactly as it appears in your `.env`
- Keep the quotes and `\n` characters

### 4. Deploy
Click **Deploy**. Wait ~3 minutes. Test:
```
https://your-service.onrender.com/api/health
```
Should return: `{"status":"ok"}`

---

## Frontend → Vercel (free)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
cd D:\scanandsee\frontend
vercel
```
Follow prompts. When asked for framework: select **Vite**.

### 3. Add environment variables
Go to **vercel.com** → your project → Settings → Environment Variables.
Add all variables from `frontend/.env.production.example`.

**Set VITE_API_URL to your Render backend URL:**
```
VITE_API_URL=https://your-backend.onrender.com
```

### 4. Redeploy
```bash
vercel --prod
```

### 5. Update CORS on backend
In Render dashboard, update `FRONTEND_URL` to your Vercel URL:
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## Firebase Console — Required Setup

1. **Authentication** → Sign-in method → Enable **Google**
2. **Firestore** → Create database → Start in test mode → us-central1
3. **Authentication** → Settings → Authorized domains → Add your Vercel domain

---

## Test Checklist After Deploy

- [ ] `GET /api/health` returns 200
- [ ] Frontend loads at Vercel URL
- [ ] Google sign-in works
- [ ] Upload a food photo → scan works
- [ ] Results page shows analysis
- [ ] Chat works
- [ ] History saves

---

## Common Issues

| Problem | Fix |
|---|---|
| CORS error | Update `FRONTEND_URL` in Render env vars |
| Firebase auth fails | Add Vercel domain to Firebase authorized domains |
| Scan 500 error | Check `GEMINI_API_KEY` is valid in Render env vars |
| Firestore 404 | Create Firestore database in Firebase Console |
| Sharp install fails on Render | Add `SHARP_IGNORE_GLOBAL_LIBVIPS=1` to Render env vars |
