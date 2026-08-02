import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_ROOT } from './common/uploads.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const baseOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    process.env.STOREFRONT_URL ?? 'http://localhost:3002',
  ];
  // Also allow the www. variant of each configured origin (e.g. Caddy serves
  // both bi3wechri.net and www.bi3wechri.net to the same storefront).
  const allowedOrigins = new Set(
    baseOrigins.flatMap((origin) => {
      try {
        const url = new URL(origin);
        const withWww = url.hostname.startsWith('www.')
          ? origin.replace('www.', '')
          : origin.replace(url.hostname, `www.${url.hostname}`);
        return [origin, withWww];
      } catch {
        return [origin];
      }
    }),
  );
  app.enableCors({
    origin: [...allowedOrigins],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
