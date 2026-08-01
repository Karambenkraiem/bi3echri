import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedClient } from '../strategies/client-jwt.strategy';

export const CurrentClient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedClient | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
