/**
 * API Client with security headers
 */

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData | string;
  headers?: Record<string, string>;
}

/**
 * Fetch wrapper that includes API key and security headers
 * Supports both JSON and FormData
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};

  // Add API key if available
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  // Merge user-provided headers
  const mergedHeaders = {
    ...headers,
    ...options.headers,
  };

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
  };

  // Handle body
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      // For FormData, don't set Content-Type (browser will add it with boundary)
      fetchOptions.body = options.body;
    } else if (typeof options.body === 'string') {
      // String body (already stringified)
      mergedHeaders['Content-Type'] = 'application/json';
      fetchOptions.body = options.body;
    } else if (typeof options.body === 'object') {
      // Plain object - stringify it
      mergedHeaders['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    } else {
      fetchOptions.body = options.body as string;
    }
  }

  if (Object.keys(mergedHeaders).length > 0) {
    fetchOptions.headers = mergedHeaders;
  }

  const response = await fetch(endpoint, fetchOptions);

  // Handle rate limiting
  if (response.status === 429) {
    const data = await response.json();
    throw new Error(`Rate limit exceeded. Retry after ${data.retryAfter} seconds.`);
  }

  // Handle other errors
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;') // Escape ampersands
    .replace(/"/g, '&quot;') // Escape quotes
    .replace(/'/g, '&#x27;') // Escape single quotes
    .trim();
}

/**
 * Validate numeric input
 */
export function isValidAmount(amount: unknown): boolean {
  const num = parseFloat(String(amount));
  return !isNaN(num) && num > 0 && num < 1e12; // Max 1 trillion
}

/**
 * Validate date string
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100;
}
