// ponytail: JWT implementation of TokenService — short-lived access tokens
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { DomainException, AUTH_TOKEN_INVALID } from '@money-manager/shared-kernel';
import { TokenService, AccessTokenPayload, IssuedAccessToken } from '../../domain/services/token-service.port';

const DEFAULT_TTL_SECONDS = 60 * 15; // 15 minutes

// ponytail: dev fallback so unit tests don't have to set JWT_SECRET; production must inject a real one
const DEV_FALLBACK_SECRET = 'dev-only-secret-please-replace-in-production-32chars';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor() {
    const envSecret = process.env['JWT_SECRET'];
    const isProd = process.env['NODE_ENV'] === 'production';
    if (isProd && (!envSecret || envSecret.length < 16)) {
      throw new Error('JWT_SECRET must be set and at least 16 chars in production');
    }
    this.secret = envSecret && envSecret.length >= 16 ? envSecret : DEV_FALLBACK_SECRET;
    this.ttlSeconds = Number(process.env['JWT_ACCESS_TTL_SECONDS'] ?? DEFAULT_TTL_SECONDS);
  }

  issue(payload: AccessTokenPayload): IssuedAccessToken {
    const token = jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: this.ttlSeconds,
    });
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    return { token, expiresAt };
  }

  verify(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
        throw DomainException.fromError(AUTH_TOKEN_INVALID);
      }
      const sub = (decoded as jwt.JwtPayload).sub;
      const email = (decoded as jwt.JwtPayload & { email?: string }).email;
      if (typeof sub !== 'string' || typeof email !== 'string') {
        throw DomainException.fromError(AUTH_TOKEN_INVALID);
      }
      return { sub, email };
    } catch (err) {
      if (err instanceof DomainException) throw err;
      throw DomainException.fromError(AUTH_TOKEN_INVALID);
    }
  }
}