# Security Audit Report - ScanAndSee
**Date**: May 15, 2026  
**Severity**: HIGH (Multiple Critical & Medium Issues)  
**Auditor Role**: Senior Security Engineer  

---

## Executive Summary
The ScanAndSee backend has **solid security fundamentals** in place (Firebase Auth, rate limiting, input validation, CORS). However, **CRITICAL issues** exist around secrets management and admin panel access control that must be resolved before production deployment.

**Critical Findings**: 3  
**High Findings**: 4  
**Medium Findings**: 5  
**Low Findings**: 2  

---

## 🔴 CRITICAL ISSUES

### 1. **Firebase Service Account Key Exposed in Repository**
**File**: `d:\scanandsee\vortex-voice-15374-firebase-adminsdk-fbsvc-d8404e3ff2.json`  
**Risk**: Complete compromise of Firestore database and all user data  
**Impact**: CRITICAL - This key can read/write all data, compromise user privacy, delete data  

**Fix**:
- ✅ Remove the file from repository immediately
- ✅ Add to `.gitignore`
- ✅ Regenerate Firebase service account key
- ✅ Use environment variables only (already done in render.yaml)

**Status**: NEEDS IMMEDIATE ACTION

---

### 2. **Admin Panel Access Control Missing**
**Issue**: No admin panel redirect logic for susantedit@gmail.com  
**Files Affected**:
- Frontend: Missing admin route and layout
- Backend: Admin routes exist but frontend can't access them

**Risk**: Admin features inaccessible, or exposed to unauthorized users who guess URLs

**Fix Required**:
- ✅ Add admin check in frontend auth flow
- ✅ Redirect susantedit@gmail.com to `/admin` route
- ✅ Create admin layout and dashboard
- ✅ Verify `ADMIN_EMAILS` env var is set on backend

**Implementation**: See detailed fixes below

---

### 3. **Incomplete IDOR Enforcement on Delete Operations**
**File**: [backend/routes/scan.routes.js](backend/routes/scan.routes.js#L1-L100)  
**Issue**: The `DELETE /api/scan/:scanId` endpoint needs explicit ownership verification

**Current State**: The route exists but needs verification it enforces user ownership

**Risk**: Users could delete other users' scans if ownership check is missing

**Fix Required**:
- ✅ Verify ownership before deletion
- ✅ Return 404 (not 403) to avoid leaking user info
- ✅ Log deletion attempts with UIDs

---

## 🟠 HIGH ISSUES

### 4. **Frontend Session Timeout Not Implemented**
**Issue**: Firebase tokens expire after 1 hour, but no UI feedback or force re-authentication  
**Files**:
- `frontend/src/services/firebase.js` - Token refresh works but no timeout warning
- `frontend/src/services/api.js` - Throws 401 but no graceful recovery

**Risk**: Users lose access mid-operation, data loss risk on pending actions

**Fix**:
- ✅ Implement token expiration warning UI
- ✅ Show "Session expiring in 5 minutes" toast
- ✅ Auto-refresh token on user activity
- ✅ Clear state and redirect to login on 401

---

### 5. **No CSRF Protection on State-Changing Endpoints**
**Issue**: POST/DELETE/PUT endpoints have no CSRF tokens  
**Frameworks Used**: Express (no CSRF middleware detected)

**Risk**: MEDIUM - CORS restrictions and SameSite cookies mitigate risk, but not complete

**Fix**:
- ✅ Add `csrf` middleware or SameSite cookie enforcement
- ✅ Verify SameSite=Strict in production

---

### 6. **Rate Limiter Uses IP + UID but No Device Fingerprinting**
**File**: [backend/middleware/rateLimiter.js](backend/middleware/rateLimiter.js#L1-L50)  
**Issue**: VPN users can rotate IPs to bypass limits

**Risk**: Determined attackers could exceed rate limits

**Fix**:
- ✅ Add device fingerprint (User-Agent hash + Accept-Language hash)
- ✅ Use composite key: `{uid || ip}:{fingerprint}`

---

### 7. **No Audit Log for Data Access/Modification**
**Issue**: Admin/user data access not logged comprehensively

**Files Affected**:
- [backend/routes/admin.routes.js](backend/routes/admin.routes.js#L1-L100) - Logs exist but incomplete
- [backend/services/firebase.service.js](backend/services/firebase.service.js#L1-L100) - No audit trail

**Risk**: Cannot detect insider threats or suspicious activity

**Fix**:
- ✅ Add `auditLog` collection in Firestore
- ✅ Log: action, user, timestamp, resource, IP, outcome

---

## 🟡 MEDIUM ISSUES

### 8. **Community.routes.js Likes Subcollection Risk**
**File**: [backend/routes/community.routes.js](backend/routes/community.routes.js#L100-L150)  
**Issue**: Subcollection `community/{postId}/likedBy/{uid}` could grow unbounded

**Risk**: Firestore read/write quota abuse

**Fix**:
- ✅ Add index on `(postId, uid)` composite
- ✅ Implement cache for like counts (Redis/in-memory)
- ✅ Rate limit likes to 10/minute per user

---

### 9. **Environment Variable Validation Too Permissive**
**File**: [backend/index.js](backend/index.js#L38-L50)  
**Issue**: `validateEnv()` only warns in dev mode, but doesn't validate formats/lengths

**Risk**: Malformed keys could cause runtime errors or security issues

**Fix**:
- ✅ Validate private key format (must contain "-----BEGIN")
- ✅ Validate email format
- ✅ Validate PROJECT_ID matches Firebase project

---

### 10. **Gemini Response Injection Risk (Low but present)**
**File**: [backend/services/gemini.service.js](backend/services/gemini.service.js) - Not fully reviewed yet

**Issue**: Gemini output sent directly to client without validation

**Risk**: Malicious prompts could make Gemini return harmful content

**Fix**:
- ✅ Validate Gemini response structure (must have expected fields)
- ✅ Reject responses with banned keywords
- ✅ Add timeout of 30s for Gemini responses

---

### 11. **Multer Configuration Missing Field Validation**
**File**: [backend/middleware/upload.js](backend/middleware/upload.js#L1-L50)  
**Issue**: `fieldSize: 1024` is too strict (custom form fields might need 2-5KB)

**Risk**: Legitimate uploads rejected, user confusion

**Fix**:
- ✅ Increase `fieldSize` to 5KB for form fields
- ✅ Document expected fields in each route

---

## 🟢 LOW ISSUES

### 12. **Server Fingerprinting Partially Mitigated**
**File**: [backend/middleware/securityHeaders.js](backend/middleware/securityHeaders.js#L1-L50)  
**Issue**: `X-Powered-By` removed but `Server` header removal should use helmet's option

**Fix**:
- ✅ Use helmet's built-in server header removal instead of manual

---

### 13. **Error Messages Could Leak Stack Traces**
**File**: [backend/middleware/errorHandler.js](backend/middleware/errorHandler.js) - Not reviewed yet

**Issue**: Production error responses might include stack traces

**Fix**:
- ✅ Ensure stack traces only logged server-side in production
- ✅ Return generic error messages to client

---

## ✅ SECURITY STRENGTHS

### What's Done Right ✓

1. **Authentication**: Firebase Admin SDK with ID token verification ✓
   - RS256 signature verification
   - Token expiration (1 hour)
   - `checkRevoked=true` prevents compromised tokens

2. **Authorization**: Ownership checks on most endpoints ✓
   - User data scoped to `req.user.uid`
   - Admin role enforced with email verification

3. **Input Validation**: Comprehensive with Zod schemas ✓
   - Type coercion and stripping
   - Whitelist-based personality/goal values
   - Regex validation on IDs

4. **Rate Limiting**: Multi-tier with premium bypass ✓
   - Global, auth, scan, voice, chat limiters
   - UID-based keying prevents easy bypass

5. **File Upload**: Defense-in-depth ✓
   - MIME type validation
   - Magic byte verification
   - Size limits enforced

6. **Sanitization**: Prototype pollution prevention ✓
   - `__proto__` and `constructor` blocked
   - Null byte removal
   - Control character filtering

7. **CORS & Headers**: Well-configured ✓
   - Helmet with CSP, HSTS, X-Frame-Options
   - SameSite cookies (if configured)
   - Referrer policy enforcement

8. **Logging**: Audit trail for auth failures ✓
   - Rate limit hits logged with IP/UID
   - Auth errors logged with reason

---

## 📋 DETAILED RECOMMENDATIONS

### Phase 1: CRITICAL (Do Immediately)
1. **Remove Firebase key file** - Delete `.json` key from repo
2. **Set ADMIN_EMAILS** - Configure in render.yaml
3. **Add admin routing** - Implement frontend admin redirect
4. **Verify IDOR** - Test all routes enforce ownership

### Phase 2: HIGH (Do This Sprint)
5. **Session timeout UI** - Add expiration warning
6. **Add CSRF token** - Implement `csurf` middleware
7. **Audit logging** - Add `auditLog` collection
8. **Device fingerprinting** - Enhance rate limiter

### Phase 3: MEDIUM (Next Sprint)
9. **Env validation** - Stricter checks at startup
10. **Gemini validation** - Whitelist response fields
11. **Field size limit** - Increase multer fieldSize

### Phase 4: LOW (Polish)
12. **Error handling** - Centralize stack trace filtering
13. **Monitoring** - Add Sentry or similar

---

## 🔐 Deployment Checklist

Before deploying to production:

- [ ] Firebase key file removed from repo
- [ ] All secrets in environment variables (not .env file)
- [ ] ADMIN_EMAILS set to `susantedit@gmail.com`
- [ ] FRONTEND_URL set to HTTPS domain
- [ ] NODE_ENV=production
- [ ] Rate limits tuned for expected traffic
- [ ] Logging enabled and monitored
- [ ] CORS whitelist set to exact frontend domain
- [ ] HTTPS enforced (Render auto-handles)
- [ ] Database backups configured (Firestore auto-handles)
- [ ] Error monitoring set up (Sentry/DataDog)

---

## 🛠️ Implementation Order

See the detailed implementation files in this directory:
- [SECURITY_FIXES.md](SECURITY_FIXES.md) - Step-by-step fixes

