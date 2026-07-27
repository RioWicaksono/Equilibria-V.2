# ADR-004: Error Handling Strategy

**Status:** Accepted  
**Date:** 2026-06-10  
**Deciders:** Project Owner

---

## Context

Equilibria Finance membutuhkan strategi error handling yang:
- Provides consistent error responses across all API endpoints
- Includes machine-readable error codes for client handling
- Logs errors appropriately for debugging
- Does not leak sensitive information in production

---

## Decision

Implement centralized error handling dengan 3 components:

### 1. Standardized Error Codes

```typescript
// src/lib/api-helpers.ts
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  CSRF_REQUIRED: 'CSRF_REQUIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
```

### 2. ApiResponse Factory

```typescript
export const ApiResponse = {
  ok: <T>(data: T, meta?: PaginationMeta) =>
    NextResponse.json({ success: true, data, meta }),

  created: <T>(data: T) =>
    NextResponse.json({ success: true, data }, { status: 201 }),

  noContent: () => new NextResponse(null, { status: 204 }),

  badRequest: (message: string, details?: unknown) =>
    createErrorResponse(ErrorCodes.VALIDATION_ERROR, message, details, 400),

  unauthorized: (message = 'Authentication required') =>
    createErrorResponse(ErrorCodes.UNAUTHORIZED, message, undefined, 401),

  notFound: (resource = 'Resource') =>
    createErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, undefined, 404),

  internalError: (message = 'An unexpected error occurred') =>
    createErrorResponse(ErrorCodes.INTERNAL_ERROR, message, undefined, 500),
};
```

### 3. Standardized Error Response Format

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      { "field": "amount", "message": "Must be positive" }
    ],
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Error Flow

```
Request
   │
   ▼
┌─────────────────┐
│ Validate Input  │──[Invalid]──► 400 Bad Request
└────────┬────────┘
         │[Valid]
         ▼
┌─────────────────┐
│ Authenticate    │──[Failed]──► 401 Unauthorized
└────────┬────────┘
         │[Success]
         ▼
┌─────────────────┐
│ Rate Limit      │──[Exceeded]──► 429 Too Many Requests
└────────┬────────┘
         │[OK]
         ▼
┌─────────────────┐
│ Business Logic  │──[Error]──► 500 Internal Error
└────────┬────────┘
         │[Success]
         ▼
      200 OK
```

---

## Consequences

### ✅ Advantages
- **Consistency:** All API endpoints return same format
- **Debugging:** `request_id` helps trace errors in logs
- **Client-friendly:** Error codes enable programmatic handling
- **Security:** No stack traces leaked to clients

### ❌ Disadvantages
- **Overhead:** Each error creates a UUID
- **Complexity:** More abstraction to learn

---

## Logging Strategy

```typescript
// Log at appropriate levels
logger.error('[GET /api/transactions]', error);
// Include request_id in logs for correlation
logger.error({ requestId, error }, 'Transaction fetch failed');
```

**Production:** Log errors to Sentry with context  
**Development:** Log to stdout with stack traces

---

## Notes

- Never expose internal error details in production
- Always log full error with stack trace server-side
- Use `request_id` for error correlation

---

**Supersedes:** N/A  
**Related ADRs:** ADR-001 (Authentication), ADR-003 (Clean Architecture)
