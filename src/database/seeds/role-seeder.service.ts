import { Injectable, Logger } from '@nestjs/common';
import { RolesService } from '../../modules/roles/roles.service';
import { ROLE_LIST } from '../../common/constants/app.constants';

@Injectable()
export class RoleSeederService {
  private readonly logger = new Logger(RoleSeederService.name);

  constructor(private readonly rolesService: RolesService) {}

  async seedRoles(): Promise<void> {
    for (const role of ROLE_LIST) {
      await this.rolesService.upsert(role.name, role.description);
      this.logger.log(`Role ready: ${role.name}`);
    }
  }
}
