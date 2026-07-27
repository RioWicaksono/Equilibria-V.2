import { NextResponse } from 'next/server';

// Standard error codes
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  CSRF_REQUIRED: 'CSRF_REQUIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

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

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Standard response creators for common scenarios
 */
export const ApiResponse = {
  // Success responses
  ok: <T>(data: T, meta?: PaginationMeta) =>
    NextResponse.json({ success: true, data, meta }),

  created: <T>(data: T) =>
    NextResponse.json({ success: true, data }, { status: 201 }),

  noContent: () => new NextResponse(null, { status: 204 }),

  // Error responses
  badRequest: (message: string, details?: unknown) =>
    createErrorResponse(ErrorCodes.VALIDATION_ERROR, message, details, 400),

  unauthorized: (message = 'Authentication required') =>
    createErrorResponse(ErrorCodes.UNAUTHORIZED, message, undefined, 401),

  forbidden: (message = 'Access denied') =>
    createErrorResponse(ErrorCodes.FORBIDDEN, message, undefined, 403),

  notFound: (resource = 'Resource') =>
    createErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, undefined, 404),

  conflict: (message: string) =>
    createErrorResponse(ErrorCodes.CONFLICT, message, undefined, 409),

  unprocessableEntity: (message: string, details?: unknown) =>
    createErrorResponse(ErrorCodes.VALIDATION_ERROR, message, details, 422),

  tooManyRequests: (retryAfter: number) =>
    NextResponse.json(
      {
        error: {
          code: ErrorCodes.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
          request_id: crypto.randomUUID(),
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    ),

  internalError: (message = 'An unexpected error occurred') =>
    createErrorResponse(ErrorCodes.INTERNAL_ERROR, message, undefined, 500),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    createErrorResponse(ErrorCodes.SERVICE_UNAVAILABLE, message, undefined, 503),
};

/**
 * Pagination types and helpers
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse pagination params from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(
    parseInt(searchParams.get('limit') || '20', 10),
    100 // Max limit to prevent abuse
  );

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 20 : limit,
    cursor: searchParams.get('cursor') || undefined,
  };
}

/**
 * Calculate offset for SQL queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// ============================================
// CURSOR-BASED PAGINATION (for large datasets)
// ============================================

/**
 * Cursor pagination params
 */
export interface CursorPaginationParams {
  cursor?: string;  // Encoded cursor string
  limit?: number;   // Number of items per page
}

/**
 * Cursor pagination metadata (for response headers)
 */
export interface CursorPaginationMeta {
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

/**
 * Paginated response with cursor
 */
export interface CursorPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: CursorPaginationMeta;
}

/**
 * Base cursor structure - encode/decode for stable pagination
 */
export interface CursorData {
  id: string;           // Last item's ID
  createdAt: string;    // Last item's createdAt for tie-breaking
  sortField?: string;   // Optional sort field value
}

/**
 * Encode cursor data to base64 string
 */
export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Decode cursor string to cursor data
 * Returns null if invalid
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const data = JSON.parse(decoded) as CursorData;

    // Validate required fields
    if (!data.id || !data.createdAt) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Parse cursor pagination params from URL search params
 */
export function parseCursorPaginationParams(
  searchParams: URLSearchParams
): CursorPaginationParams {
  const limit = Math.min(
    parseInt(searchParams.get('limit') || '20', 10),
    100 // Max limit
  );

  return {
    cursor: searchParams.get('cursor') || undefined,
    limit: isNaN(limit) || limit < 1 ? 20 : limit,
  };
}

/**
 * Create cursor pagination metadata
 */
export function createCursorPaginationMeta(
  items: unknown[],
  limit: number,
  getLastItem: (items: unknown[]) => CursorData | null
): CursorPaginationMeta {
  const lastItem = getLastItem(items);

  return {
    next_cursor: lastItem ? encodeCursor(lastItem) : null,
    has_more: items.length === limit,
    limit,
  };
}

/**
 * Create cursor pagination response
 */
export function createCursorPaginatedResponse<T>(
  data: T[],
  limit: number,
  getLastItem: (items: T[]) => CursorData | null
): CursorPaginatedResponse<T> {
  const lastItem = data.length > 0 ? getLastItem(data) : null;

  return {
    success: true,
    data,
    meta: {
      next_cursor: lastItem ? encodeCursor(lastItem) : null,
      has_more: data.length === limit,
      limit,
    },
  };
}
