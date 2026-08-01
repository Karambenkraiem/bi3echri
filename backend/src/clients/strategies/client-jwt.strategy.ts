import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface ClientJwtPayload {
  sub: string;
  email: string | null;
}

export interface AuthenticatedClient {
  clientId: string;
  email: string | null;
}

function clientSecret(configService: ConfigService): string {
  const dedicated = configService.get<string>('CLIENT_JWT_SECRET');
  if (dedicated) return dedicated;
  return `${configService.get<string>('JWT_SECRET') ?? 'dev-secret'}-client`;
}

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: clientSecret(configService),
    });
  }

  validate(payload: ClientJwtPayload): AuthenticatedClient {
    return { clientId: payload.sub, email: payload.email };
  }
}
