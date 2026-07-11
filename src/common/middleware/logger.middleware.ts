import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

const logger = new Logger('HTTP');

/**
 * Functional middleware applied to EVERY API request (registered globally with
 * `app.use()` in main.ts). It logs method, url, status code and duration.
 *
 * A functional middleware is used instead of the class-based `NestMiddleware`
 * + `MiddlewareConsumer.forRoutes('*')` pattern because, on Express 5, a bare
 * `'*'` wildcard route is rejected by path-to-regexp. Registering globally is
 * the simplest way to cover all routes reliably.
 */
export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { method, originalUrl } = req;
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.log(
      `${method} ${originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`,
    );
  });

  next();
}
