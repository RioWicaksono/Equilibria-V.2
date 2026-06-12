/**
 * Security Utilities
 * Provides hashing and verification functions for sensitive data
 */

/**
 * Hash a string using SHA-256
 * Uses Web Crypto API for browser-side hashing
 */
export async function hashString(input: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for server-side or when crypto is not available
    return simpleHash(input);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return simpleHash(input);
  }
}

/**
 * Simple hash fallback using string manipulation
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Verify a string against a hash
 */
export async function verifyHash(input: string, hash: string): Promise<boolean> {
  const inputHash = await hashString(input);
  return timingSafeEqual(inputHash, hash);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a random salt for hashing
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash PIN with salt for secure storage
 */
export async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const pinSalt = salt || generateSalt();
  const combined = `${pin}:${pinSalt}`;
  const hash = await hashString(combined);
  return { hash, salt: pinSalt };
}

/**
 * Verify PIN against stored hash and salt
 */
export async function verifyPin(pin: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPin(pin, salt);
  return verifyHash(hash, storedHash);
}

/**
 * Simple Base64 encode (for non-sensitive data only)
 * @deprecated Use hashing for sensitive data
 */
export function base64Encode(str: string): string {
  if (typeof window === 'undefined') {
    throw new Error('base64Encode is only available in browser environment');
  }
  return btoa(str);
}

/**
 * Simple Base64 decode
 * @deprecated Use hashing for sensitive data
 */
export function base64Decode(str: string): string {
  if (typeof window === 'undefined') {
    throw new Error('base64Decode is only available in browser environment');
  }
  try {
    return atob(str);
  } catch {
    return '';
  }
}
