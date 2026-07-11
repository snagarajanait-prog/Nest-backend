import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Every field of CreateProductDto becomes optional for updates.
export class UpdateProductDto extends PartialType(CreateProductDto) {}
