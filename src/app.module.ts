import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import configuration from './config/configuration';
import { CONFIG } from './common/constants/app.constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ProductsModule } from './modules/products/products.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    // Loads the correct .env.<NODE_ENV> file and exposes typed config globally.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    // MongoDB connection.
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(CONFIG.MONGODB_URI),
      }),
    }),
    // Serve uploaded images at http://host/uploads/<filename>.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
      serveRoot: '/uploads',
    }),
    // Enables @Cron scheduling (used later for the cron/queues task).
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    ProductsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
