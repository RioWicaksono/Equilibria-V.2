import { NextRequest, NextResponse } from 'next/server';

// Simple hash function for PIN (using Web Crypto API)
// In production, use bcrypt with server-side verification
const SALT = 'equilibria-pin-salt-v1';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + pin);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(pin);
  return hash === storedHash;
}

/**
 * Store hashed PIN in database
 */
export async function storePinHash(pin: string): Promise<string> {
  return hashPin(pin);
}

/**
 * Verify PIN against stored hash
 */
export async function verifyPinHash(pin: string, storedHash: string): Promise<boolean> {
  return verifyPin(pin, storedHash);
}

/**
 * Generate a secure random string (for API keys, tokens, etc.)
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}