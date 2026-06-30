// ponytail: JWT auth middleware — verifies mm-at cookie, sets x-user-id for downstream services
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const DEV_FALLBACK_SECRET = 'dev-only-secret-please-replace-in-production-32chars';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly secret: string;

  constructor() {
    const envSecret = process.env['JWT_SECRET'];
    const isProd = process.env['NODE_ENV'] === 'production';
    if (isProd && (!envSecret || envSecret.length < 16)) {
      throw new Error('JWT_SECRET must be set and at least 16 chars in production');
    }
    this.secret = envSecret && envSecret.length >= 16 ? envSecret : DEV_FALLBACK_SECRET;
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const token = (req.cookies as Record<string, string> | undefined)?.['mm-at'];
    if (token) {
      try {
        const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
        if (typeof decoded.sub === 'string') {
          req.headers['x-user-id'] = decoded.sub;
        }
      } catch {
        // invalid or expired token — do not set x-user-id; downstream returns 401
      }
    }
    next();
  }
}
