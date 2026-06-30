// Security: extracts userId from request — requires x-user-id header
// Throws UnauthorizedException if header is missing (no silent fallback to DEFAULT)
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../value-objects/user-id';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserId => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    console.log('[CurrentUser] x-user-id header:', userId, 'all headers:', JSON.stringify(request.headers));
    if (!userId) {
      console.log('[CurrentUser] No x-user-id header, throwing UnauthorizedException');
      throw new UnauthorizedException('x-user-id header is required');
    }
    return new UserId(userId);
  },
);
