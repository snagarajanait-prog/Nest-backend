import { Types } from 'mongoose';

/**
 * Internal DTO used by the service layer to create a user. The `password` is
 * already hashed and `role` is a resolved ObjectId by the time it gets here.
 */
export interface CreateUserData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string; // hashed
  role: Types.ObjectId;
  phone?: string;
}
