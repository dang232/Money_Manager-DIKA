// ponytail: users proxy — forwards /api/users/* to user-service via mTLS
import { Controller, Get, Put, Patch, Post, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpProxyService } from './http-proxy.service';

@Controller('api/users')
export class UsersProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Get('me')
  me(@Req() req: Request) {
    return this.proxy.request('user', 'GET', '/users/me', req);
  }

  @Put('me')
  updateMe(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('user', 'PUT', '/users/me', req, body);
  }

  @Put('me/preferences')
  updatePrefs(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('user', 'PUT', '/users/me/preferences', req, body);
  }

  @Get(':id')
  getPublic(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('user', 'GET', `/users/${id}`, req);
  }

  @Patch('layout')
  updateLayout(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('user', 'PATCH', '/layout', req, body);
  }

  @Get('layout')
  getLayout(@Req() req: Request) {
    return this.proxy.request('user', 'GET', '/layout', req);
  }

  @Post('layout/beacon')
  beaconLayout(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('user', 'POST', '/layout/beacon', req, body);
  }
}