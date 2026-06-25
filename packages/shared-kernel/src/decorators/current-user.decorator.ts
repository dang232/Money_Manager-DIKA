// ponytail: extracts userId from request — swap to req.user.sub when Keycloak lands
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserId } from '../value-objects/user-id';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserId => {
    const request = ctx.switchToHttp().getRequest();
    // Future: const sub = request.user?.sub;
    const userId = request.headers['x-user-id'] || UserId.DEFAULT.value;
    return new UserId(userId);
  },
);
