import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CONFIG, MESSAGES } from '../../../common/constants/app.constants';
import { AuthUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string; // role name
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(CONFIG.JWT_SECRET) ?? 'change_me',
    });
  }

  /** Return value is attached to `request.user`. */
  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException(MESSAGES.AUTH.UNAUTHORIZED);
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
