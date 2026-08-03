import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface ClientJwtPayload {
  sub: string;
  email: string | null;
  // Présent uniquement quand ce token a été émis via "Voir le site comme
  // client" depuis le back office : permet au client de revenir vers son
  // compte vendeur/admin d'origine sans se reconnecter.
  staffUserId?: string;
}

export interface AuthenticatedClient {
  clientId: string;
  email: string | null;
  staffUserId?: string;
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
    return { clientId: payload.sub, email: payload.email, staffUserId: payload.staffUserId };
  }
}
