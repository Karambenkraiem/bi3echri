import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientsAdminController } from './clients-admin.controller';
import { ClientJwtStrategy } from './strategies/client-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('CLIENT_JWT_SECRET') ??
          `${configService.get<string>('JWT_SECRET') ?? 'dev-secret'}-client`,
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ?? '30d') as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [ClientsController, ClientsAdminController],
  providers: [ClientsService, ClientJwtStrategy],
  exports: [ClientsService],
})
export class ClientsModule {}
