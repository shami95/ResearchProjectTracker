import { AuthUser, UserRole } from '../types';

interface DecodedJwtPayload {
  sub: string;
  role: UserRole;
  userId: string;
  fullName: string;
  iat: number;
  exp: number;
}

/**
 * Decodes a JWT's payload without verifying its signature (signature
 * verification happens server-side). Used purely to read the username,
 * role and expiry so the UI can rehydrate session state on page refresh.
 */
export function decodeToken(token: string): DecodedJwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

export function userFromToken(token: string): AuthUser | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    userId: decoded.userId,
    username: decoded.sub,
    fullName: decoded.fullName,
    role: decoded.role,
  };
}
