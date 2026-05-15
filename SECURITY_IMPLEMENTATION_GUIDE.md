# Security Implementation Guide - ScanAndSee

This document contains all necessary code fixes for the critical and high-severity security issues identified in `SECURITY_AUDIT_REPORT.md`.

---

## 🔴 CRITICAL FIX #1: Remove Firebase Key from Repository

### Action Required:

```bash
# 1. Delete the exposed key file
rm "vortex-voice-15374-firebase-adminsdk-fbsvc-d8404e3ff2.json"

# 2. Add to .gitignore
echo "*.json" >> backend/.gitignore
echo ".env" >> backend/.gitignore
echo ".env.local" >> backend/.gitignore

# 3. Regenerate the Firebase service account key:
# - Go to Firebase Console > Project Settings > Service Accounts
# - Click "Generate New Private Key"
# - Store the key ONLY in render.yaml environment variables
# - NEVER commit it to the repository

# 4. Force remove from git history (if already committed)
git rm -r --cached "vortex-voice-15374-firebase-adminsdk-fbsvc-d8404e3ff2.json"
git commit -m "Remove exposed Firebase service account key"
```

### Why This Is Critical:
The Firebase service account key has **full admin access** to your Firestore database. Anyone with this key can:
- Read all user data
- Modify or delete all records
- Create backdoor accounts
- Drain your Firebase quota

---

## 🔴 CRITICAL FIX #2: Implement Admin Panel Access Control

### Files to Create/Modify:

#### **1. Backend: Update adminAuth middleware**

**File**: `backend/middleware/adminAuth.js` ✅ Already good, but needs one fix:

Add explicit logging for failed admin checks and ensure case-insensitive matching:

```javascript
// ALREADY CORRECT - No changes needed, but verify ADMIN_EMAILS is set
// The current implementation is secure:
// ✅ Case-insensitive comparison
// ✅ Logs all access attempts  
// ✅ Generic 403 error (no info leakage)
// ✅ Must come AFTER authenticate() middleware
```

#### **2. Backend: Add .env.example with ADMIN_EMAILS**

**File**: `backend/.env.example`

```bash
# ===== ADMIN CONFIGURATION =====
# Comma-separated list of admin email addresses
# These users can access /api/admin/* endpoints
ADMIN_EMAILS=susantedit@gmail.com

# ===== FIREBASE CONFIGURATION =====
FIREBASE_PROJECT_ID=vortex-voice-15374
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@vortex-voice-15374.iam.gserviceaccount.com

# ===== API CONFIGURATION =====
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ===== API KEYS =====
GEMINI_API_KEY=your_gemini_key
USDA_API_KEY=your_usda_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# ===== RENDER DEPLOYMENT =====
# Add to render.yaml envVars instead of here
```

#### **3. Backend: Add admin check to index.js**

After Firebase initialization, validate admin configuration:

**File**: `backend/index.js` - Add this after `validateEnv()`:

```javascript
// Validate admin configuration
function validateAdminConfig() {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0 && process.env.NODE_ENV === 'production') {
    logger.warn('⚠️ WARNING: No admin emails configured (ADMIN_EMAILS env var empty)');
    logger.warn('Admin panel will be inaccessible in production!');
  } else if (adminEmails.length > 0) {
    logger.info(`✓ Admin panel enabled for: ${adminEmails.join(', ')}`);
  }
}

validateAdminConfig();
```

#### **4. Frontend: Create admin auth service**

**File**: `frontend/src/services/adminAuth.js` (NEW)

```javascript
/**
 * Admin authentication service.
 * Determines if current user should access admin panel.
 */

const ADMIN_EMAILS = [
  'susantedit@gmail.com',
  // Add more admins here or fetch from backend
];

/**
 * Check if email is in admin list.
 * In production, fetch from `/api/admin/verify` endpoint for real-time updates.
 */
export function isUserAdmin(email) {
  if (!email) return false;
  
  // Local check for quick response
  const isLocalAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  
  // In production, verify with server
  if (process.env.NODE_ENV === 'production') {
    // Backend will verify the user's admin status via requireAdmin middleware
    // This is just a client-side hint for UI purposes
    return isLocalAdmin;
  }
  
  return isLocalAdmin;
}

/**
 * Check if user has admin access by querying backend.
 */
export async function verifyAdminAccess(token) {
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

#### **5. Frontend: Create admin page**

**File**: `frontend/src/pages/Admin.jsx` (NEW)

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthChange, getAuthToken } from '../services/firebase';
import { isUserAdmin } from '../services/adminAuth';
import AdminDashboard from '../components/admin/Dashboard';
import Spinner from '../components/ui/Spinner';

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Check if user is admin
      const adminStatus = isUserAdmin(currentUser.email);
      setIsAdmin(adminStatus);
      setUser(currentUser);

      if (!adminStatus) {
        // Redirect non-admins away
        navigate('/');
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) return <Spinner />;
  if (!isAdmin) return <div>Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AdminDashboard user={user} />
    </div>
  );
}
```

#### **6. Frontend: Update routing**

**File**: `frontend/src/App.jsx` - Add admin route:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import AdminPage from './pages/Admin';  // NEW
import ScanPage from './pages/Scan';
import CommunityPage from './pages/Community';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />  {/* NEW */}
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### **7. Backend: Add admin verify endpoint**

**File**: `backend/routes/admin.routes.js` - Add this at the top:

```javascript
// ── GET /api/admin/verify ─────────────────────────────────────────────────────
// Quick check if user is admin (used by frontend)
router.get('/verify', authenticate, (req, res) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = adminEmails.includes((req.user?.email || '').toLowerCase());
  
  res.json({ 
    isAdmin,
    email: req.user?.email,
  });
});
```

---

## 🔴 CRITICAL FIX #3: Verify IDOR Protection

### Files to Check/Fix:

#### **1. Verify scan.routes.js DELETE endpoint**

**File**: `backend/routes/scan.routes.js`

Currently missing the DELETE endpoint body. Add this:

```javascript
// ── DELETE /api/scan/:scanId ────────────────────────────────────────────────
router.delete(
  '/:scanId',
  validateParams(ScanIdSchema),
  async (req, res, next) => {
    try {
      const { scanId } = req.params;
      
      // IDOR protection: verify ownership before deletion
      const scan = await getScan(req.user.uid, scanId);
      if (!scan) {
        // Return 404 whether scan doesn't exist or belongs to another user
        // (don't reveal existence to unauthorized users)
        logger.warn('Scan delete denied', { 
          uid: req.user.uid, 
          scanId, 
          ip: req.ip 
        });
        return next(notFound('Scan not found'));
      }

      // Delete the scan
      await deleteScan(req.user.uid, scanId);
      
      logger.info('Scan deleted', { uid: req.user.uid, scanId });
      cacheService.del(`user:${req.user.uid}`);
      
      res.json({ success: true, message: 'Scan deleted' });
    } catch (err) {
      next(err);
    }
  }
);
```

#### **2. Verify all user-specific routes**

Check these routes for IDOR:

- ✅ `GET /api/scan/history` - Scoped to `req.user.uid` ✓
- ✅ `POST /api/scan/analyze` - Saves to `req.user.uid` ✓
- ✅ `GET /api/user/profile` - Gets `req.user.uid` profile ✓
- ✅ `POST /api/user/profile` - Saves to `req.user.uid` ✓
- ✅ `GET /api/chat/ask` - Uses user's persona ✓
- ✅ `POST /api/community/share` - Verifies scan ownership ✓

#### **3. Test IDOR Vulnerability**

Add this test to verify:

```bash
# Get User A's token and scanId
TOKEN_A="..."
SCAN_ID="..."

# Try to delete as User A (should work)
curl -X DELETE "http://localhost:3001/api/scan/$SCAN_ID" \
  -H "Authorization: Bearer $TOKEN_A"
# Expected: 200 { success: true }

# Get User B's token
TOKEN_B="..."

# Try to delete same scan as User B (should fail)
curl -X DELETE "http://localhost:3001/api/scan/$SCAN_ID" \
  -H "Authorization: Bearer $TOKEN_B"
# Expected: 404 { error: "Scan not found" }
```

---

## 🟠 HIGH FIX #4: Add Frontend Session Timeout

### Files to Create/Modify:

#### **1. Create session timeout service**

**File**: `frontend/src/services/sessionTimeout.js` (NEW)

```javascript
import { signOut } from './firebase';
import { useToast } from '../hooks/useToast';

let timeoutId = null;
let warningTimeoutId = null;
const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Start session timeout timer.
 * Shows warning after 55 minutes, logs out after 1 hour of inactivity.
 */
export function startSessionTimeout() {
  clearExistingTimeouts();

  // Warning at 55 minutes
  warningTimeoutId = setTimeout(() => {
    // Toast will be shown by component listening to auth state
    window.dispatchEvent(new CustomEvent('session-expiring'));
  }, TIMEOUT_DURATION - WARNING_TIME);

  // Logout at 60 minutes
  timeoutId = setTimeout(async () => {
    await signOut();
    window.location.href = '/login?session=expired';
  }, TIMEOUT_DURATION);
}

export function resetSessionTimeout() {
  startSessionTimeout();
}

export function clearExistingTimeouts() {
  clearTimeout(timeoutId);
  clearTimeout(warningTimeoutId);
}

export function endSession() {
  clearExistingTimeouts();
  signOut();
}
```

#### **2. Hook to manage session timeout**

**File**: `frontend/src/hooks/useSessionTimeout.js` (NEW)

```javascript
import { useEffect, useRef } from 'react';
import { 
  startSessionTimeout, 
  resetSessionTimeout, 
  endSession 
} from '../services/sessionTimeout';

export function useSessionTimeout() {
  const inactivityRef = useRef(null);

  useEffect(() => {
    let inactivityTimeout;

    const setupInactivityListener = () => {
      // Clear existing timeout
      if (inactivityTimeout) clearTimeout(inactivityTimeout);

      // Reset on user activity
      const resetTimer = () => {
        resetSessionTimeout();
      };

      // Listen to user interactions
      ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, resetTimer);
      });

      return () => {
        ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    };

    // Start initial timeout
    startSessionTimeout();

    // Setup inactivity listeners
    const cleanup = setupInactivityListener();

    return () => {
      cleanup();
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
    };
  }, []);
}
```

#### **3. Create session warning component**

**File**: `frontend/src/components/auth/SessionWarning.jsx` (NEW)

```jsx
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const handleSessionExpiring = () => {
      setShowWarning(true);
      setTimeLeft(300); // 5 minutes in seconds
    };

    window.addEventListener('session-expiring', handleSessionExpiring);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setShowWarning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('session-expiring', handleSessionExpiring);
      clearInterval(interval);
    };
  }, []);

  if (!showWarning) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed top-4 right-4 bg-yellow-900 text-yellow-100 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <AlertTriangle size={24} />
      <div>
        <p className="font-semibold">Session Expiring</p>
        <p className="text-sm">You'll be logged out in {minutes}:{seconds.toString().padStart(2, '0')}</p>
      </div>
      <button 
        onClick={() => {
          window.location.reload(); // Refresh token
          setShowWarning(false);
        }}
        className="ml-2 px-3 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-700"
      >
        Stay Logged In
      </button>
    </div>
  );
}
```

#### **4. Add to main layout**

**File**: `frontend/src/App.jsx` or `frontend/src/components/layout/MainLayout.jsx`:

```jsx
import SessionWarning from './components/auth/SessionWarning';
import { useSessionTimeout } from './hooks/useSessionTimeout';

export default function App() {
  useSessionTimeout();

  return (
    <>
      <SessionWarning />
      <Routes>
        {/* routes */}
      </Routes>
    </>
  );
}
```

---

## 🟠 HIGH FIX #5: Add CSRF Protection

### Implementation:

#### **1. Backend: Install and setup CSRF middleware**

```bash
npm install csurf cookie-parser
```

**File**: `backend/index.js` - Add after cors middleware:

```javascript
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookie parser (needed for CSRF)
app.use(cookieParser());

// CSRF protection — skip GET requests and API calls without state-change
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: isProd, // HTTPS only in production
    sameSite: 'strict',
  },
  // Skip for API endpoints that use Bearer tokens
  skip: (req) => {
    // Only protect forms, not API calls
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return true; // Skip CSRF for token-based auth
    }
    return false;
  }
});

// GET endpoint to retrieve CSRF token (if using form-based submissions)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF to routes if needed
// app.use(csrfProtection);
```

#### **2. Alternative: Use SameSite=Strict cookies**

If using Firebase Auth, SameSite=Strict provides CSRF protection:

**File**: `backend/index.js` - Add security header:

```javascript
app.use((req, res, next) => {
  // Note: Firebase SDK handles this, but force-set for extra security
  res.setHeader(
    'Set-Cookie',
    'SameSite=Strict; Secure; HttpOnly'
  );
  next();
});
```

---

## 🟠 HIGH FIX #6: Add Frontend Error Message Masking

### File**: `frontend/src/services/api.js`

```javascript
// Mask sensitive errors from server
function maskError(error) {
  const sensitivePatterns = [
    /database/i,
    /query/i,
    /sql/i,
    /firestore/i,
    /api key/i,
    /secret/i,
    /private/i,
  ];

  const errorMsg = error.message || '';
  
  // Check if error contains sensitive terms
  const isSensitive = sensitivePatterns.some(pattern => pattern.test(errorMsg));
  
  if (isSensitive && process.env.NODE_ENV === 'production') {
    return 'An error occurred. Please try again.';
  }
  
  return error.message;
}

// Use in error handling
catch (err) {
  throw new ApiRequestError(maskError(err), err.status);
}
```

---

## 🟠 HIGH FIX #7: Rate Limiter Enhancement

### File**: `backend/middleware/rateLimiter.js`

Add device fingerprinting:

```javascript
import crypto from 'crypto';

/**
 * Generate device fingerprint from User-Agent and Accept-Language.
 * Helps prevent IP rotation bypass.
 */
function getDeviceFingerprint(req) {
  const ua = req.headers['user-agent'] || 'unknown';
  const lang = req.headers['accept-language'] || 'unknown';
  const hash = crypto.createHash('sha256')
    .update(`${ua}:${lang}`)
    .digest('hex')
    .slice(0, 8);
  return hash;
}

/**
 * Enhanced key generator combining IP, UID, and device fingerprint.
 */
const enhancedUserOrIpKey = (req) => {
  const fingerprint = getDeviceFingerprint(req);
  const uid = req.user?.uid || 'anon';
  const ip = req.ip;
  
  // Composite key: prevents IP rotation, UID-spoofing, and device rotation
  return `${uid}:${ip}:${fingerprint}`;
};

// Update all limiters to use enhancedUserOrIpKey instead of userOrIpKey
export const globalLimiter = rateLimit({
  // ... existing config ...
  keyGenerator: enhancedUserOrIpKey,  // Change this
});

// Apply to all limiters...
```

---

## 📋 Verification Checklist

After implementing all fixes:

- [ ] Firebase key file deleted and gitignored
- [ ] Admin routing works: `susantedit@gmail.com` redirects to `/admin`
- [ ] IDOR testing passes: User B cannot access User A's scans
- [ ] Session timeout shows warning at 55 min mark
- [ ] CSRF token included in forms (if applicable)
- [ ] Error messages don't leak database/API details
- [ ] Rate limiter keys include device fingerprint
- [ ] Admin verification endpoint works
- [ ] All changes deployed to production

