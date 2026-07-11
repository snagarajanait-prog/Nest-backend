import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RoleName, MESSAGES } from '../constants/app.constants';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Allows a request through only if the authenticated user's role is one of the
 * roles required by `@Roles(...)`. Must run AFTER JwtAuthGuard so `user` exists.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user || !required.includes(user.role as RoleName)) {
      throw new ForbiddenException(MESSAGES.AUTH.FORBIDDEN);
    }
    return true;
  }
}
