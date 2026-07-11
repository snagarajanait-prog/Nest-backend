import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../roles/schemas/role.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true, default: '' })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  // `select: false` => password is never returned by default queries.
  // Login explicitly re-selects it with `.select('+password')`.
  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: Types.ObjectId, ref: Role.name, required: true })
  role: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
