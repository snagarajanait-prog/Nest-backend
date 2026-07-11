import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Shape attached to `request.user` by the JwtStrategy. */
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Inject the authenticated user (or one of its fields) into a controller
 * method: `@CurrentUser() user: AuthUser` or `@CurrentUser('userId') id`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    return data && user ? user[data] : user;
  },
);
