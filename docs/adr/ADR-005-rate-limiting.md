# ADR-005: Rate Limiting Strategy

**Status:** Accepted  
**Date:** 2026-06-10  
**Deciders:** Project Owner

---

## Context

Equilibria Finance membutuhkan rate limiting untuk:
- Prevent API abuse
- Protect against DDoS attacks
- Ensure fair usage
- Protect expensive operations (AI, OCR)

---

## Decision

Implement multi-tier rate limiting dengan database-backed store.

### Rate Limit Tiers

| Endpoint Type | Limit | Window | Reason |
|---------------|-------|--------|--------|
| Public (health, docs) | Unlimited | - | No abuse risk |
| General API | 100 req | 1 minute | Standard protection |
| Sensitive (auth, telegram) | 30 req | 1 minute | Higher risk |
| Write operations | 60 req | 1 minute | Resource intensive |

### Implementation

```typescript
// lib/db-rate-limit.ts
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  DEFAULT: { maxRequests: 100, windowMs: 60 * 1000 },
  SENSITIVE: { maxRequests: 30, windowMs: 60 * 1000 },
  WRITE: { maxRequests: 60, windowMs: 60 * 1000 },
};

export async function checkDatabaseRateLimit(
  req: Request,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): Promise<RateLimitResult> {
  const ip = getClientIP(req);
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Use Redis or database to track requests
  // ...
}
```

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1624500000
```

### 429 Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 45
  }
}
```

---

## Consequences

### ✅ Advantages
- **Protection:** Prevents abuse and DDoS
- **Fairness:** All clients get equal access
- **Observable:** Headers show remaining quota
- **Configurable:** Easy to adjust limits per endpoint

### ❌ Disadvantages
- **Database overhead:** Each request hits DB/cache
- **Complexity:** Need to manage window cleanup
- **Latency:** Rate limit check adds ~1-5ms

---

## Alternative: In-Memory Rate Limiting

```typescript
// Simple in-memory (NOT for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= 100) return false;
  record.count++;
  return true;
}
```

**Rejected:** Won't work with multiple server instances (Vercel serverless)

---

## Scaling Considerations

**Current (Vercel):** Database-backed rate limiting  
**Future (Multi-instance):** Redis-backed rate limiting

```typescript
// Future: Redis implementation
const redis = new Redis(process.env.REDIS_URL);

async function checkRedisRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= 100;
}
```

---

## Notes

- Consider adding per-API-key rate limits in future
- Implement gradual increase for premium users
- Monitor rate limit hits for anomaly detection

---

**Supersedes:** N/A  
**Related ADRs:** ADR-001 (Authentication), ADR-004 (Error Handling)
