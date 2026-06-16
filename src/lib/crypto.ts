/**
 * Security Utilities for PIN and sensitive data
 * Uses bcryptjs for PIN hashing with OWASP-recommended cost factor
 */

import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12; // OWASP recommended minimum

/**
 * Generate cryptographically secure random bytes
 */
export function getSecureRandomBytes(length: number): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  // Server-side Node.js
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }
  // Fallback - NOT cryptographically secure, but better than nothing
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
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
    result |= a.codePointAt(i)! ^ b.codePointAt(i)!;
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
 * Hash PIN with bcrypt (recommended for password/PIN hashing)
 * Uses cost factor of 12 (OWASP recommended minimum)
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify PIN against bcrypt hash
 */
export async function verifyPinHash(inputPin: string, storedHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(inputPin, storedHash);
  } catch {
    return false;
  }
}

/**
 * Simple direct PIN comparison (for plain storage - less secure)
 * Use hashPin/verifyPinHash for better security
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
