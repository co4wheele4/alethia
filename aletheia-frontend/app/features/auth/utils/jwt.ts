/**
 * JWT utilities (client-side safe)
 */

import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
};

function isProbablyJwt(token: string): boolean {
  // JWTs are typically three base64url parts: header.payload.signature
  return token.split('.').length === 3;
}

/**
 * Extract the user id from a JWT token (payload `sub`).
 * Returns null if token is missing/invalid/not a JWT.
 */
export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  if (!isProbablyJwt(token)) return null;

  try {
    const payload = jwtDecode<JwtPayload>(token);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

