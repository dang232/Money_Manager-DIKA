// ponytail: TokenService port — issues and verifies short-lived access JWTs
export const TOKEN_SERVICE = 'TOKEN_SERVICE';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export interface IssuedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface TokenService {
  issue(payload: AccessTokenPayload): IssuedAccessToken;
  verify(token: string): AccessTokenPayload;
}