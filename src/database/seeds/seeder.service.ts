import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { RolesService } from '../../modules/roles/roles.service';
import { UsersService } from '../../modules/users/users.service';
import { ROLE_LIST, ROLES } from '../../common/constants/app.constants';

const SALT_ROUNDS = 10;

/**
 * Idempotent seeder: safe to run multiple times. It ensures the two roles
 * exist and creates a default admin + a default user if they are missing.
 */
@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async run(): Promise<void> {
    await this.seedRoles();
    await this.seedUsers();
  }

  private async seedRoles(): Promise<void> {
    for (const role of ROLE_LIST) {
      await this.rolesService.upsert(role.name, role.description);
      this.logger.log(`Role ready: ${role.name}`);
    }
  }

  private async seedUsers(): Promise<void> {
    const adminRole = await this.rolesService.findByName(ROLES.ADMIN);
    const userRole = await this.rolesService.findByName(ROLES.USER);

    await this.ensureUser(
      this.config.get<string>('seed.adminEmail') ?? 'admin@example.com',
      this.config.get<string>('seed.adminPassword') ?? 'Admin@123',
      'Admin',
      adminRole._id,
    );

    await this.ensureUser(
      this.config.get<string>('seed.userEmail') ?? 'user@example.com',
      this.config.get<string>('seed.userPassword') ?? 'User@123',
      'User',
      userRole._id,
    );
  }

  private async ensureUser(
    email: string,
    password: string,
    firstName: string,
    roleId: Types.ObjectId,
  ): Promise<void> {
    if (await this.usersService.existsByEmail(email)) {
      this.logger.log(`User already exists: ${email}`);
      return;
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await this.usersService.create({
      firstName,
      email,
      password: hashedPassword,
      role: roleId,
    });
    this.logger.log(`Created user: ${email}`);
  }
}
