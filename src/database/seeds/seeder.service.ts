import { Injectable } from '@nestjs/common';
import { RoleSeederService } from './role-seeder.service';
import { UserSeederService } from './user-seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly roleSeeder: RoleSeederService,
    private readonly userSeeder: UserSeederService,
  ) {}

  async run(): Promise<void> {
    await this.roleSeeder.seedRoles();
    await this.userSeeder.seedUsers();
  }

  async seedRoles(): Promise<void> {
    await this.roleSeeder.seedRoles();
  }

  async seedUsers(): Promise<void> {
    await this.userSeeder.seedUsers();
  }
}
