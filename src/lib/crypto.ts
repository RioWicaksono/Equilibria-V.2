/**
 * Security Utilities for PIN and sensitive data
 * Uses Web Crypto API with SHA-256 hashing
 */

/**
 * Generate cryptographically secure random bytes
 */
function getSecureRandomBytes(length: number): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  // Fallback - NOT cryptographically secure, but better than nothing
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

/**
 * SHA-256 hash using Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Server-side or crypto not available - use simple hash
    return simpleHash(message);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return simpleHash(message);
  }
}

/**
 * Simple deterministic hash for environments without crypto
 * Uses djb2 algorithm for consistency
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeCompare(a: string, b: string): boolean {
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
 * Generate a random salt
 */
export function generateSalt(length: number = 16): string {
  const bytes = getSecureRandomBytes(length);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash PIN with salt using PBKDF2-like approach
 * This provides better security than simple hashing
 */
export async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const pinSalt = salt || generateSalt();
  // Combine PIN with salt multiple times for better security
  const iterations = 1000;
  let result = pin + pinSalt;

  for (let i = 0; i < iterations; i++) {
    result = await sha256(result + i.toString());
  }

  return { hash: result, salt: pinSalt };
}

/**
 * Verify PIN against stored hash and salt
 */
export async function verifyPin(inputPin: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPin(inputPin, salt);
  return timingSafeCompare(hash, storedHash);
}

/**
 * Simple direct PIN comparison
 * Use this when PIN is stored directly (less secure)
 */
export function comparePin(input: string, stored: string): boolean {
  return timingSafeCompare(input, stored);
}

/**
 * Base64 encode (for non-sensitive data only)
 */
export function base64Encode(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return btoa(str);
}

/**
 * Base64 decode
 */
export function base64Decode(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'base64').toString();
  }
  try {
    return atob(str);
  } catch {
    return '';
  }
}
