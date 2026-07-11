import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: '', trim: true })
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
