import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { MESSAGES } from '../../common/constants/app.constants';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  /** Find a role by its name (e.g. 'admin' / 'user'). */
  async findByName(name: string): Promise<RoleDocument> {
    const role = await this.roleModel.findOne({ name }).exec();
    if (!role) {
      throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND);
    }
    return role;
  }

  /** Create a role if it does not already exist (used by the seeder). */
  async upsert(name: string, description: string): Promise<RoleDocument> {
    return await this.roleModel
      .findOneAndUpdate(
        { name },
        { $setOnInsert: { name, description } },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  async findAll(): Promise<RoleDocument[]> {
    return await this.roleModel.find().exec();
  }
}
