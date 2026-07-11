import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MESSAGES } from '../constants/app.constants';

/**
 * Shared helper used inside service-level try/catch blocks. Known
 * HttpExceptions (NotFound, Conflict, Unauthorized, ...) pass through
 * untouched; anything unexpected is logged and turned into a safe 500 so we
 * never leak internal details to the client.
 */
export function normalizeHttpError(
  error: unknown,
  logger: Logger,
): HttpException {
  if (error instanceof HttpException) {
    return error;
  }
  logger.error(
    'Unexpected error',
    error instanceof Error ? error.stack : String(error),
  );
  return new InternalServerErrorException(
    MESSAGES.GENERIC.SOMETHING_WENT_WRONG,
  );
}
