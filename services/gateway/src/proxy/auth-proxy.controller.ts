// ponytail: auth proxy — forwards /api/auth/* to auth service, sets HttpOnly cookies on the gateway boundary
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpProxyService } from './http-proxy.service';
import { setAuthCookies, clearAuthCookies } from './cookie-auth.helper';

interface AuthServiceTokenResponse {
  data: {
    user: {
      id: string;
      email: string;
      displayName: string;
      createdAt: string;
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
    tokenType: string;
  };
}

interface AuthServiceRefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
    tokenType: string;
  };
}

@Controller('api/auth')
export class AuthProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.proxy.request<AuthServiceTokenResponse>('auth', 'POST', '/auth/register', req, body);
    setAuthCookies(res, { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken });
    // ponytail: strip tokens from browser response — they live in HttpOnly cookies now
    return { data: { user: result.data.user } };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.proxy.request<AuthServiceTokenResponse>('auth', 'POST', '/auth/login', req, body);
    setAuthCookies(res, { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken });
    return { data: { user: result.data.user } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // ponytail: read refresh token from HttpOnly cookie, forward to auth service in body
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.['mm-rt'];
    if (!refreshToken) {
      res.status(401);
      return { message: 'No refresh token' };
    }
    const result = await this.proxy.request<AuthServiceRefreshResponse>(
      'auth', 'POST', '/auth/refresh', req, { refreshToken },
    );
    setAuthCookies(res, { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken });
    return { data: {} };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.['mm-rt'];
    if (refreshToken) {
      // ponytail: best-effort — clear cookies regardless of whether auth service call succeeds
      await this.proxy.request('auth', 'POST', '/auth/logout', req, { refreshToken }).catch(() => {});
    }
    clearAuthCookies(res);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.proxy.request('auth', 'GET', '/auth/me', req);
  }
}
