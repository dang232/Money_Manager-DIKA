// ponytail: transaction proxy — forwards all /api/transactions to transaction service
import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpProxyService } from './http-proxy.service';

@Controller('api/transactions')
export class TransactionProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post()
  create(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('transaction', 'POST', '/transactions', req, body);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.proxy.request('transaction', 'GET', '/transactions', req);
  }

  @Get('summary')
  summary(@Req() req: Request) {
    return this.proxy.request('transaction', 'GET', '/transactions/summary', req);
  }

  @Get('category-breakdown')
  categoryBreakdown(@Req() req: Request) {
    return this.proxy.request('transaction', 'GET', '/transactions/category-breakdown', req);
  }

  @Get('monthly-trend')
  monthlyTrend(@Req() req: Request) {
    return this.proxy.request('transaction', 'GET', '/transactions/monthly-trend', req);
  }

  @Get('stats')
  stats(@Req() req: Request) {
    return this.proxy.request('transaction', 'GET', '/transactions/stats', req);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('transaction', 'GET', `/transactions/${id}`, req);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('transaction', 'PUT', `/transactions/${id}`, req, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('transaction', 'DELETE', `/transactions/${id}`, req);
  }
}
