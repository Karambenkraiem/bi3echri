import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClientAuthGuard extends AuthGuard('client-jwt') {}

/**
 * Same strategy, but never rejects the request — attaches the client if a
 * valid token is present, otherwise leaves req.user null. Used on public
 * endpoints (e.g. creating a guest order) that behave the same whether or
 * not the visitor is logged in, but should link the order to their account
 * when they are.
 */
@Injectable()
export class OptionalClientAuthGuard extends AuthGuard('client-jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user ?? (null as TUser);
  }
}
