// ponytail: cookie helpers shared by auth proxy — generates CSRF tokens, sets the three auth cookies
import { Response } from 'express';
import { randomBytes } from 'crypto';

export const ACCESS_COOKIE = 'mm-at';
export const REFRESH_COOKIE = 'mm-rt';
export const CSRF_COOKIE = 'mm-csrf';

const IS_PROD = process.env['NODE_ENV'] === 'production';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function setAuthCookies(res: Response, tokens: TokenPair): string {
  const csrfToken = generateCsrfToken();

  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/auth/refresh',
  });

  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false, // must be JS-readable for double-submit pattern
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });

  return csrfToken;
}

export function clearAuthCookies(res: Response): void {
  const cookieOptions = { httpOnly: true, secure: IS_PROD, sameSite: 'strict' as const };
  res.clearCookie(ACCESS_COOKIE, { ...cookieOptions, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, path: '/api/auth/refresh' });
  res.clearCookie(CSRF_COOKIE, { httpOnly: false, secure: IS_PROD, sameSite: 'strict', path: '/' });
}
