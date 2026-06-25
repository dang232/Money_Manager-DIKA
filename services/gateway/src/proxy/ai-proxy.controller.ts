// ponytail: AI proxy — forwards /api/ai to AI service
import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpProxyService } from './http-proxy.service';

@Controller('api/ai')
export class AiProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post('categorize')
  categorize(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('ai', 'POST', '/ai/categorize', req, body);
  }

  @Post('insights')
  insights(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('ai', 'POST', '/ai/insights', req, body);
  }

  @Get('insights')
  getInsights(@Req() req: Request) {
    return this.proxy.request('ai', 'GET', '/ai/insights', req);
  }

  @Post('chat')
  chat(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('ai', 'POST', '/ai/chat', req, body);
  }
}
