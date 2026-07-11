import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './seed.module';
import { SeederService } from './seeder.service';

/**
 * Entry point run with `npm run seed`. Boots a lightweight Nest context (DB
 * connection only), runs the seeder, then shuts down.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Seed');
  const appContext = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'error', 'warn'],
  });
  try {
    await appContext.get(SeederService).run();
    logger.log('Seeding complete ✅');
  } catch (error) {
    logger.error(
      'Seeding failed',
      error instanceof Error ? error.stack : String(error),
    );
    process.exitCode = 1;
  } finally {
    await appContext.close();
  }
}

void bootstrap();
