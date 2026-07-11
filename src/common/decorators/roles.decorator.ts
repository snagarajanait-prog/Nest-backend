import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, RoleName } from '../constants/app.constants';

/**
 * Attach required roles to a route handler, e.g. `@Roles(ROLES.ADMIN)`.
 * Read back by the RolesGuard.
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
