// ponytail: CSRF double-submit middleware — mm-csrf cookie must match X-CSRF-Token header
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// ponytail: auth endpoints set the CSRF cookie, so they cannot require it yet
const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) return next();

    const url = req.originalUrl || req.path;
    if (CSRF_EXEMPT_PREFIXES.some((p) => url.startsWith(p))) return next();

    const cookieToken = (req.cookies as Record<string, string> | undefined)?.['mm-csrf'];
    const headerToken = req.headers['x-csrf-token'] as string | undefined;

    if (!cookieToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }
    next();
  }
}
