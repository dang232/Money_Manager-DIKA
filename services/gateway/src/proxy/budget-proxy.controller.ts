// ponytail: budget proxy — forwards /api/budgets and /api/categories to budget service
import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { HttpProxyService } from './http-proxy.service';

@Controller('api/budgets')
export class BudgetProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post()
  create(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('budget', 'POST', '/budgets', req, body);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.proxy.request('budget', 'GET', '/budgets', req);
  }

  @Get('projections')
  projections(@Req() req: Request) {
    return this.proxy.request('budget', 'GET', '/budgets/projections', req);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('budget', 'GET', `/budgets/${id}`, req);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('budget', 'PUT', `/budgets/${id}`, req, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('budget', 'DELETE', `/budgets/${id}`, req);
  }

  // Handle DELETE with query params (categoryId, year, month)
  @Delete()
  removeByQuery(@Req() req: Request) {
    return this.proxy.request('budget', 'DELETE', '/budgets', req);
  }
}

@Controller('api/categories')
export class CategoryProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post()
  create(@Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('budget', 'POST', '/categories', req, body);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.proxy.request('budget', 'GET', '/categories', req);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('budget', 'GET', `/categories/${id}`, req);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    return this.proxy.request('budget', 'PUT', `/categories/${id}`, req, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.proxy.request('budget', 'DELETE', `/categories/${id}`, req);
  }
}
