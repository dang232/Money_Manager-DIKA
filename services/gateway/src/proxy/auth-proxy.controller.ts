// ponytail: auth proxy — forwards /api/auth/* to auth service
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpProxyService } from './http-proxy.service';

@Controller('api/auth')
export class AuthProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post('register')
  register(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('auth', 'POST', '/auth/register', req, body);
  }

  @Post('login')
  login(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('auth', 'POST', '/auth/login', req, body);
  }

  @Post('refresh')
  refresh(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('auth', 'POST', '/auth/refresh', req, body);
  }

  @Post('logout')
  logout(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('auth', 'POST', '/auth/logout', req, body);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.proxy.request('auth', 'GET', '/auth/me', req);
  }
}