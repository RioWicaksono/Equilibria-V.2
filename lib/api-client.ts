/**
 * API Client with security headers
 */

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/**
 * Fetch wrapper that includes API key and security headers
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add API key if available
  if (API_KEY) {
    (headers as Record<string, string>)['x-api-key'] = API_KEY;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

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
export function isValidAmount(amount: any): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1e12; // Max 1 trillion
}

/**
 * Validate date string
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100;
}