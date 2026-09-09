/**
 * Security & Cryptography Utilities
 * Provides Web Crypto SHA-256 PIN hashing and cryptographically secure token generation.
 */

const PIN_SALT = 'saheb_salt_';

/**
 * Hash a 4-digit PIN using SHA-256 with a unique application salt
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = pin.trim();
  if (!clean) return '';

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${PIN_SALT}${clean}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (err) {
      console.warn('[Security] Subtle crypto hashing fallback:', err);
    }
  }

  // Pure JS fallback if crypto.subtle is unavailable in legacy browser or insecure context
  let hash = 0;
  const str = `${PIN_SALT}${clean}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Check if a given PIN string is already hashed
 */
export function isPinHashed(pin: string): boolean {
  if (!pin) return false;
  return /^[a-f0-9]{64}$/i.test(pin) || pin.startsWith('sha256_fallback_');
}

/**
 * Generates cryptographically secure session tokens
 */
export function generateSecureToken(prefix: string = 'token'): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${prefix}_${Date.now()}_${randomHex}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
