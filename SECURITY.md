# Security Documentation

## Vulnerability Remediation (January 2026)

The following security vulnerabilities were identified and patched as part of a comprehensive security audit.

### 1. Broken Access Control in Server Actions

**Severity:** Critical
**Fix:** Implemented database-backed token validation in `src/actions/links.ts`. The system now verifies that the Bearer token corresponds to an active, non-expired session in the `AdminSessions` table before allowing any CRUD operations on links.

### 2. Stored Cross-Site Scripting (XSS) in Admin CRM

**Severity:** Critical
**Fix:** Added client-side HTML sanitization in `src/pages/admin/crm.astro`. User-supplied data (names, messages) is now escaped using a custom `escapeHtml` function before being injected into the DOM, preventing the execution of malicious scripts.

### 3. HTML Injection in Email Notifications

**Severity:** High
**Fix:** Implemented server-side HTML escaping in `src/pages/api/sendEmail.json.ts`. User inputs are sanitized before being interpolated into the email body, preventing attackers from injecting arbitrary HTML or scripts into administrator notifications.

---

## Modern Hardening (February 2026)

### 🚀 Astro Actions

- **Built-in Security**: Replaced legacy API routes with Astro Actions, which provide automatic CSRF protection and type-safe schema validation (Zod).
- **Reduced Surface Area**: Eliminated several public JSON endpoints in favor of internal actions.

### 🛡️ Middleware Architecture

- **Centralized Guarding**: `middleware.ts` now acts as a global security layer, enforcing HSTS, CSP, and authentication BEFORE any page rendering begins.
- **Hardened Headers**:
  - `Content-Security-Policy`: Strict script and style source control.
  - `Strict-Transport-Security`: Enforced HTTPS.

---

## Client Portal Authentication (September 2026)

A separate, per-client file portal (`/client/*`, `/clients/[slug]/*`) exists alongside the admin panel, with its own auth stack:

### 🔑 Password Storage

- **PBKDF2**: 100,000 iterations, SHA-256, 256-bit derived key, 16-byte random salt per password (`src/lib/clientAuth.ts` `hashPassword`)
- **Constant-time comparison** on verify (`verifyPassword`) to prevent timing attacks

### ✉️ Onboarding & Password Reset

- Single-use setup/reset tokens: 32 bytes of `crypto.getRandomValues` entropy, URL-safe base64 (`generateSetupToken`)
- Only the **SHA-256 hash** of the token is stored on the `Clients` row (`setupTokenHash`, `setupTokenExpiresAt`); the raw token only ever appears in the emailed link
- 7-day expiry (`SETUP_TOKEN_TTL_DAYS`, `src/lib/clientOnboarding.ts`)
- Initial invite, admin "resend invite," and client-initiated "forgot password" all issue tokens through the same `issueSetupLink` helper and redeem through one single-use `/client/set-password` endpoint

### 🍪 Sessions

- DB-backed (`ClientSessions` table), **2-hour expiry**, same duration constant `CLIENT_SESSION_DURATION_MS` used for cookie `maxAge` (`src/lib/clientSession.ts`)
- Cookies: `httpOnly`, `secure` in production, `sameSite: 'strict'` — strict SameSite gives CSRF protection without a separate token
- **Device fingerprinting**: hash of User-Agent + IP; a session used from a different fingerprint is deleted and the request rejected (`requireClientSession`)
- **Per-client page isolation**: `requireClientAccess` additionally checks the session's `clientSlug` matches the `[slug]` in the URL, so client A cannot reach client B's pages even with a valid session
- Expired sessions are swept by `cleanExpiredClientSessions`

### 📎 Private File Delivery

- Client files live in **Vercel Blob** as private objects; the app only ever hands out short-lived **signed download URLs**, never a public blob URL

**Known gap:** no rate limiting yet on `/api/client/auth.json` (login) or `/api/client/forgot-password.json` — tracked as the top-priority item in [`docs/SECURITY-HARDENING-PLAN.md`](./docs/SECURITY-HARDENING-PLAN.md).

---

## Enhanced Admin Authentication System

This portfolio implements a robust, multi-layered authentication system for admin functionality with the following security features:

### 🔐 Database-Backed Session Management

- **Persistent Sessions**: Sessions are stored in the database instead of memory, preventing loss on server restarts
- **Session Expiration**: Sessions automatically expire after 2 hours instead of 24 hours
- **Automatic Cleanup**: Expired sessions are automatically removed from the database

### 🖥️ Device Fingerprinting

- **Device Tracking**: Each session is tied to a unique device fingerprint based on User-Agent and IP address
- **Session Hijacking Prevention**: If a token is used from a different device, the session is invalidated
- **Multi-Device Limitation**: Maximum of 2 active sessions per device fingerprint

### 🕒 Enhanced Session Validation

- **Server-Side Verification**: All admin actions verify the session on the server
- **Real-Time Validation**: Sessions are validated every 2 minutes on the client-side
- **Activity Tracking**: Last activity is updated on each authenticated request

### 🚪 Secure Logout

- **Server-Side Invalidation**: Logout removes the session from the database
- **Cross-Tab Sync**: Logout in one tab affects all tabs
- **Complete Cleanup**: All authentication data is cleared from localStorage

## Security Improvements Over Previous System

### Before (Vulnerable)

- ❌ In-memory session storage (lost on restart)
- ❌ 24-hour session duration
- ❌ Client-side only validation
- ❌ No device verification
- ❌ No session invalidation across devices

### After (Secure)

- ✅ Database-backed session persistence
- ✅ 2-hour session duration with automatic renewal
- ✅ Server-side session validation
- ✅ Device fingerprinting for additional security
- ✅ Automatic session cleanup and invalidation

## API Endpoints

### POST /api/auth.json

**Login:**

```json
{
	"secretKey": "your-secret-key"
}
```

**Logout:**

```json
{
	"action": "logout"
}
```

### GET /api/auth.json

**Session Validation:**
Returns current authentication status and updates session activity.

## Database Schema

### AdminSessions Table

- `id`: Session identifier (Primary Key)
- `token`: Bearer token for API authentication
- `deviceFingerprint`: Unique device identifier
- `userAgent`: Client User-Agent string
- `ip`: Client IP address
- `createdAt`: Session creation timestamp
- `expiresAt`: Session expiration timestamp
- `lastActivity`: Last activity timestamp

## Client-Side Security Features

### Automatic Session Validation

- Validates session on page load
- Periodic validation every 2 minutes
- Redirects to login on validation failure

### Enhanced Error Handling

- Graceful handling of expired sessions
- Clear error messages for authentication failures
- Automatic cleanup of invalid localStorage data

### Device Tracking

- Stores device fingerprint in localStorage
- Validates device fingerprint on each session check
- Invalidates session if device doesn't match

## Security Best Practices

1. **Secret Key**: Use a strong, unique API_SECRET_KEY environment variable
2. **HTTPS**: Always use HTTPS in production for secure cookie transmission
3. **Regular Cleanup**: Expired sessions are automatically cleaned up
4. **Session Monitoring**: Monitor AdminSessions table for suspicious activity
5. **Rate Limiting**: Not yet implemented on admin or client auth endpoints — see [`docs/SECURITY-HARDENING-PLAN.md`](./docs/SECURITY-HARDENING-PLAN.md) item 1

## Environment Variables

```env
API_SECRET_KEY=your-strong-secret-key-here
NODE_ENV=production  # Ensures secure cookies in production
```

## Troubleshooting

### Session Issues

- Clear localStorage if experiencing authentication issues
- Check browser console for detailed error messages
- Verify API_SECRET_KEY is set correctly

### Database Issues

- Ensure AdminSessions table exists in database
- Check database connectivity for session operations
- Monitor database for session cleanup operations

This enhanced security system provides enterprise-level authentication suitable for production deployment while maintaining usability across devices.
