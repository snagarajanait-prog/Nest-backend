import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '../../config/configuration';
import { CONFIG } from '../../common/constants/app.constants';
import { RolesModule } from '../../modules/roles/roles.module';
import { UsersModule } from '../../modules/users/users.module';
import { SeederService } from './seeder.service';

/** Minimal module that only wires up the DB connection + the seeder. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(CONFIG.MONGODB_URI),
      }),
    }),
    RolesModule,
    UsersModule,
  ],
  providers: [SeederService],
})
export class SeedModule {}
