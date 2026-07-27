# ADR-001: API Authentication Strategy

**Status:** Accepted  
**Date:** 2026-06-03  
**Deciders:** Project Owner

---

## Context

Equilibria Finance adalah aplikasi pencatatan keuangan pribadi yang membutuhkan secure API access untuk:
- Mobile app integration
- Telegram bot commands
- Third-party service integrations
- Automated backups

Aplikasi ini adalah **single-tenant** (personal use), bukan multi-user SaaS, sehingga tidak memerlukan OAuth2 atau user authentication yang kompleks.

---

## Decision

Menggunakan **API Key-based authentication** dengan header `X-API-Key`.

### Implementation

```typescript
// middleware.ts
function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = process.env.API_SECRET_KEY;

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(apiKey, expectedKey)) {
    return false;
  }
  return true;
}
```

### Protected vs Public Paths

```typescript
const PROTECTED_PATHS = [
  '/api/transactions',
  '/api/budgets',
  '/api/wallets',
  '/api/goals',
  '/api/debts',
  '/api/recurring',
  '/api/summary',
  '/api/export',
];

const PUBLIC_PATHS = [
  '/api/health',
  '/api/docs',
  '/api/telegram-webhook',
  '/api/settings',
];
```

---

## Consequences

### ✅ Advantages
- **Simplicity:** Easy to implement and use
- **Performance:** No token validation overhead
- **Portable:** Can be used by scripts, bots, mobile apps
- **Stateless:** No session management needed

### ❌ Disadvantages
- **No granular permissions:** Single key = full access
- **Key rotation:** Manual process (90-day rotation recommended)
- **No user context:** Cannot track per-user actions

---

## Alternatives Considered

| Option | Rejected Reason |
|--------|-----------------|
| OAuth2 | Overkill for single-user app |
| JWT | Requires token refresh logic |
| Session-based | Not RESTful, bad for API |
| Basic Auth | Credentials in every request |

---

## Notes

- API key should be min 256-bit random (32 bytes hex)
- Store as `API_SECRET_KEY` in environment variables
- Consider adding rate limiting per key in future

---

**Supersedes:** N/A  
**Related ADRs:** ADR-004 (Error Handling), ADR-005 (Rate Limiting)
