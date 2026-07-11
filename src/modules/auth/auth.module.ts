import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { MailModule } from '../mail/mail.module';
import { CONFIG } from '../../common/constants/app.constants';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(CONFIG.JWT_SECRET) ?? 'change_me',
        signOptions: {
          // env value like "1d"/"12h"; cast to the ms StringValue union JWT expects.
          expiresIn: (config.get<string>(CONFIG.JWT_EXPIRES_IN) ??
            '1d') as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
