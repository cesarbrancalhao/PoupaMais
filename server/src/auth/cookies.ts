import type { Response, Request } from 'express';
import { randomBytes } from 'crypto';

export const TOKEN_COOKIE_NAME = 'token';
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export interface CookieOptionsResolved {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
}

function shouldUseSecureCookies(req?: Request): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) || req.protocol;
    return proto === 'https';
  }
  return process.env.NODE_ENV === 'production';
}

function getMaxAgeMs(): number {
  const days = Number(process.env.AUTH_COOKIE_DAYS) || 7;
  return days * 24 * 60 * 60 * 1000;
}

export function buildAuthCookieOptions(req?: Request): CookieOptionsResolved {
  const sameSite =
    (process.env.COOKIE_SAMESITE as 'strict' | 'lax' | 'none' | undefined) || 'strict';
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(req),
    sameSite,
    path: '/',
    maxAge: getMaxAgeMs(),
  };
}

export function buildCsrfCookieOptions(req?: Request): CookieOptionsResolved {
  const sameSite =
    (process.env.COOKIE_SAMESITE as 'strict' | 'lax' | 'none' | undefined) || 'strict';
  return {
    httpOnly: false,
    secure: shouldUseSecureCookies(req),
    sameSite,
    path: '/',
    maxAge: getMaxAgeMs(),
  };
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function setAuthCookies(res: Response, req: Request, token: string): string {
  const csrf = generateCsrfToken();
  res.cookie(TOKEN_COOKIE_NAME, token, buildAuthCookieOptions(req));
  res.cookie(CSRF_COOKIE_NAME, csrf, buildCsrfCookieOptions(req));
  return csrf;
}

function omitMaxAge(opts: CookieOptionsResolved): Omit<CookieOptionsResolved, 'maxAge'> {
  const cleared: Partial<CookieOptionsResolved> = { ...opts };
  delete cleared.maxAge;
  return cleared as Omit<CookieOptionsResolved, 'maxAge'>;
}

export function clearAuthCookies(res: Response, req: Request): void {
  res.clearCookie(TOKEN_COOKIE_NAME, omitMaxAge(buildAuthCookieOptions(req)));
  res.clearCookie(CSRF_COOKIE_NAME, omitMaxAge(buildCsrfCookieOptions(req)));
}
