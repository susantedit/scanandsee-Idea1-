# Security Deployment Checklist - ScanAndSee

**Complete this checklist before deploying to production.**

---

## 🔐 SECRETS & CREDENTIALS

### Firebase Service Account
- [ ] Old `.json` key file **DELETED** from repository
- [ ] New service account key **GENERATED** in Firebase Console
- [ ] Private key **STORED** in Render environment variables (not as .json file)
- [ ] `FIREBASE_PROJECT_ID` set correctly
- [ ] `FIREBASE_CLIENT_EMAIL` set correctly
- [ ] Firebase key includes literal `\n` for line breaks: `"-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"`

### Admin Configuration
- [ ] `ADMIN_EMAILS` environment variable set to `susantedit@gmail.com`
- [ ] Verified in render.yaml or deployment platform

### External API Keys
- [ ] `GEMINI_API_KEY` set (production key, not demo)
- [ ] `USDA_API_KEY` set (has production rate limits)
- [ ] `ELEVENLABS_API_KEY` set (if using voice generation)

### Never Commit These Files
- [ ] No `.env` file in repository
- [ ] No `.env.local` file in repository
- [ ] No `*.json` files with credentials in repository
- [ ] `.gitignore` includes: `*.json`, `.env*`, `*.pem`

---

## 🌐 ENVIRONMENT CONFIGURATION

### Backend (Node.js)
- [ ] `NODE_ENV=production` (strict error handling)
- [ ] `PORT=3001` (or appropriate for platform)
- [ ] `FRONTEND_URL=https://your-domain.com` (HTTPS required)
- [ ] All required env vars set (run `npm start` locally to test)

### Frontend (React)
- [ ] `VITE_API_URL=https://api.your-domain.com` (HTTPS required)
- [ ] `VITE_FIREBASE_API_KEY` set (public key, safe in frontend)
- [ ] `VITE_FIREBASE_PROJECT_ID` matches backend
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` set correctly
- [ ] `VITE_FIREBASE_APP_ID` set correctly

### HTTPS Enforcement
- [ ] Backend API is HTTPS only
- [ ] Frontend is HTTPS only
- [ ] SSL certificate is valid (not self-signed in production)
- [ ] No mixed HTTP/HTTPS content warnings

---

## 🔒 AUTHENTICATION & AUTHORIZATION

### Firebase Admin SDK
- [ ] Firebase Admin SDK initialized successfully on backend startup
- [ ] Logs show: `✓ Firebase Admin initialized — project: vortex-voice-15374`
- [ ] `authenticate()` middleware applied to all protected routes

### Admin Panel
- [ ] Admin verification endpoint working: `GET /api/admin/verify`
- [ ] `ADMIN_EMAILS` env var correctly formatted (comma-separated)
- [ ] Logs show: `✓ Admin panel enabled for: susantedit@gmail.com`
- [ ] Frontend admin routing implemented
- [ ] `/admin` route requires authentication

### Session Management
- [ ] Firebase token auto-refresh working (1 hour TTL)
- [ ] Frontend session timeout hook enabled
- [ ] Session warning appears 5 minutes before logout
- [ ] Users see "Stay Logged In" button before auto-logout

---

## 🛡️ SECURITY HEADERS

### HTTP Response Headers
- [ ] `Strict-Transport-Security: max-age=31536000` (HSTS, HTTPS only)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (no clickjacking)
- [ ] `X-XSS-Protection: 1; mode=block` (if not using CSP)
- [ ] `Content-Security-Policy: default-src 'none'` (strict CSP)
- [ ] `Referrer-Policy: no-referrer` (privacy)
- [ ] `Server` header removed (no fingerprinting)

### CORS Configuration
- [ ] CORS whitelist set to exact frontend domain only
- [ ] No `*` (wildcard) CORS in production
- [ ] `credentials: same-origin` in fetch calls
- [ ] Preflight requests handled correctly

### Cookie Security (if used)
- [ ] `HttpOnly` flag set (not accessible via JavaScript)
- [ ] `Secure` flag set (HTTPS only)
- [ ] `SameSite=Strict` set (CSRF protection)

---

## 📊 INPUT VALIDATION & SANITIZATION

### All User Inputs
- [ ] Zod schemas validate all request bodies
- [ ] Query parameters validated with Zod schemas
- [ ] URL parameters validated before use
- [ ] File uploads validated (MIME type + magic bytes)
- [ ] File size limits enforced (max 10MB)

### File Upload Security
- [ ] Multer MIME type filter enabled
- [ ] Magic byte validation in `handleUpload()`
- [ ] Uploaded files never executed or served as-is
- [ ] Images processed/resized before storage
- [ ] EXIF data stripped from images

### Input Sanitization
- [ ] Prototype pollution prevented (`__proto__` blocked)
- [ ] Null bytes removed from strings
- [ ] Control characters removed
- [ ] Max string length enforced (10,000 chars)
- [ ] Max array length enforced (200 items)
- [ ] Max object nesting enforced (5 levels)

---

## ⏱️ RATE LIMITING & DDoS PROTECTION

### Rate Limiters Configured
- [ ] Global limiter: 100/15min (free), 500/15min (premium)
- [ ] Auth limiter: 20/15min per IP (brute force protection)
- [ ] Scan limiter: 5/hour (free), 50/hour (premium)
- [ ] Voice limiter: 10/hour (free), 100/hour (premium)
- [ ] Chat limiter: 20/hour (free), 200/hour (premium)
- [ ] All limiters include device fingerprinting (UA + language hash)

### Abuse Detection
- [ ] Rate limit hits logged with IP + UID
- [ ] Auth failure attempts logged
- [ ] Failed admin access attempts logged
- [ ] Suspicious patterns detectable in logs

---

## 📝 LOGGING & MONITORING

### Server-Side Logging
- [ ] Winston logger configured (`logs/` directory created)
- [ ] Error logs written to `logs/error.log`
- [ ] Combined logs written to `logs/combined.log`
- [ ] Console output enabled in production
- [ ] Log level set to `info` (not `debug` in production)

### Monitored Events
- [ ] Authentication failures logged
- [ ] Authorization failures logged
- [ ] Rate limit hits logged
- [ ] Unusual API patterns logged
- [ ] Admin access attempts logged
- [ ] IDOR attempt detection (404 for non-owner access)

### Monitoring Tools (Optional but Recommended)
- [ ] Sentry error tracking configured (optional)
- [ ] DataDog/New Relic APM configured (optional)
- [ ] Log aggregation service connected (optional)

---

## 🗄️ DATABASE SECURITY

### Firestore Configuration
- [ ] Database rules configured (not in `.rules.json` in repo)
- [ ] Only authenticated users can read their own data
- [ ] Ownership checks on all write operations
- [ ] Admin role has appropriate permissions
- [ ] No public read access to user data
- [ ] Backup configured and tested

### Data Protection
- [ ] Sensitive data encrypted at rest (Firestore handles)
- [ ] No plaintext passwords stored (Firebase Auth handles)
- [ ] PII only stored when necessary
- [ ] Data retention policies defined
- [ ] Deletion/compliance procedures in place

---

## 🔍 IDOR (Insecure Direct Object Reference) Prevention

### Data Access Enforcement
- [ ] All GET requests verify user owns the resource
- [ ] All POST requests verify user owns the resource being modified
- [ ] All DELETE requests verify user owns the resource
- [ ] 404 returned for non-owner access (don't say "forbidden")
- [ ] Ownership check happens before any data operation

### Verified Routes
- [ ] `GET /api/scan/:scanId` - Scoped to user
- [ ] `DELETE /api/scan/:scanId` - Ownership verified
- [ ] `GET /api/user/profile` - Gets own profile
- [ ] `POST /api/user/profile` - Updates own profile
- [ ] `GET /api/chat/ask` - Uses own persona
- [ ] `POST /api/community/share` - Verifies scan ownership

---

## 🎯 PRODUCTION READINESS

### Performance
- [ ] Response times < 500ms for typical requests
- [ ] Rate limits tuned for expected traffic
- [ ] Database queries optimized (indexes on frequently queried fields)
- [ ] Caching enabled for expensive operations (USDA data, etc.)

### Reliability
- [ ] Error handling tested for all edge cases
- [ ] Graceful degradation when external APIs fail
- [ ] Retry logic for transient failures
- [ ] Circuit breaker pattern for Gemini API (if rate-limited)

### Compliance
- [ ] GDPR compliance: data export/deletion available
- [ ] Privacy policy references security measures
- [ ] Terms of service include liability limitations
- [ ] Data breach notification plan in place
- [ ] Security incident response plan documented

### Maintenance
- [ ] Node.js version specified in `engines` field
- [ ] Dependencies regularly updated
- [ ] Security patch process defined
- [ ] Deployment rollback procedure documented

---

## ✅ FINAL VERIFICATION

### Pre-Deployment Test
```bash
# 1. Local build test
npm install
npm run build
npm start

# 2. Test admin access
curl -X GET http://localhost:3001/api/admin/verify \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
# Should return: { isAdmin: true/false, email: "..." }

# 3. Test rate limiting
for i in {1..150}; do
  curl -X GET http://localhost:3001/api/user/profile \
    -H "Authorization: Bearer $TOKEN" &
done
wait
# After 100 requests, should see 429 rate limit errors

# 4. Test session warning
# Open frontend, watch for session timeout warning at 55 min mark

# 5. Test IDOR
# Sign in as User A, get scanId
# Sign in as User B, try to access User A's scanId
# Should get 404, not 200
```

### Post-Deployment Verification
- [ ] Monitor logs for first 24 hours
- [ ] Test admin panel with `susantedit@gmail.com`
- [ ] Verify session timeout works
- [ ] Confirm rate limiting active
- [ ] Test error scenarios (invalid input, etc.)
- [ ] Monitor error rate (should be < 1% of requests)
- [ ] Verify HTTPS certificate is valid

---

## 🚨 INCIDENT RESPONSE

### If Exposed Secret Detected
1. Immediately regenerate the secret
2. Rotate all dependent credentials
3. Monitor for unauthorized access
4. Check git history for exposure duration
5. Notify affected users if necessary
6. Update deployment documentation

### If Security Breach Suspected
1. Enable enhanced logging/monitoring
2. Review recent logs for suspicious activity
3. Verify database integrity
4. Check admin access logs
5. Scan for malicious deployments
6. Consider emergency maintenance window
7. Document incident timeline

---

## 📋 SIGN-OFF

- [ ] Security checklist completed by: ________________
- [ ] Date: ________________
- [ ] Review by second person: ________________
- [ ] Deployment approved by: ________________

---

## 📞 Support Contacts

- **Firebase Support**: https://firebase.google.com/support
- **Render Support**: https://render.com/support
- **Node.js Security**: https://nodejs.org/en/security/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

