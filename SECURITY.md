# Security Documentation

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
5. **Rate Limiting**: Consider adding rate limiting to auth endpoints

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
