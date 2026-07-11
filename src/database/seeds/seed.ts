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
    const seeder = appContext.get(SeederService);
    const target = process.argv[2]?.toLowerCase() ?? 'all';

    switch (target) {
      case 'roles':
        await seeder.seedRoles();
        break;
      case 'users':
        await seeder.seedUsers();
        break;
      case 'all':
      case 'seed':
        await seeder.run();
        break;
      default:
        logger.warn(
          `Unknown seed target "${target}". Expected: roles, users, all. Running full seed.`,
        );
        await seeder.run();
        break;
    }

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
