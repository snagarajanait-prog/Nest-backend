import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { loggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // All controller routes are served under /api.
  app.setGlobalPrefix('api');

  // Allow the React frontend (different origin) to call the API.
  app.enableCors({ origin: true, credentials: true });

  // Global request-logging middleware (applies to every API route).
  app.use(loggerMiddleware);

  // Validate + transform every incoming DTO. `whitelist` strips unknown props.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Consistent JSON error shape for anything that reaches the top level.
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(
    `🚀 Backend running at http://localhost:${port}/api`,
  );
}

void bootstrap();
