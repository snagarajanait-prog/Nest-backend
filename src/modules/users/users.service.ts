import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserData } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserData): Promise<UserDocument> {
    const user = new this.userModel(data);
    return await user.save();
  }

  /** Default query — password is excluded because of `select: false`. */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /** Includes the hashed password + populated role name; used for login. */
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('role', 'name')
      .exec();
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return await this.userModel.findById(id).populate('role', 'name').exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ email: email.toLowerCase() })
      .exec();
    return count > 0;
  }

  async updateLastLogin(id: Types.ObjectId): Promise<void> {
    await this.userModel
      .updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } })
      .exec();
  }
}
