import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder, Types } from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { DEFAULTS, MESSAGES } from '../../common/constants/app.constants';
import { normalizeHttpError } from '../../common/utils/errors';

// Mongoose 9 renamed `FilterQuery` -> `QueryFilter`.
type ProductFilter = QueryFilter<ProductDocument>;

export interface PaginatedProducts {
  items: ProductDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(
    dto: CreateProductDto,
    images: string[],
    userId?: string,
  ): Promise<ProductDocument> {
    try {
      const product = new this.productModel({
        ...dto,
        images,
        createdBy: userId ? new Types.ObjectId(userId) : null,
      });
      return await product.save();
    } catch (error) {
      throw normalizeHttpError(error, this.logger);
    }
  }

  async findAll(filter: FilterProductDto): Promise<PaginatedProducts> {
    try {
      const conditions = this.buildConditions(filter);
      const page = filter.page ?? DEFAULTS.PAGE;
      const limit = filter.limit ?? DEFAULTS.LIMIT;
      const sortBy = filter.sortBy ?? DEFAULTS.SORT_BY;
      const sortOrder: SortOrder =
        (filter.sortOrder ?? DEFAULTS.SORT_ORDER) === 'asc' ? 1 : -1;

      const [items, total] = await Promise.all([
        this.productModel
          .find(conditions)
          .sort({ [sortBy]: sortOrder })
          .skip((page - 1) * limit)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments(conditions).exec(),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      throw normalizeHttpError(error, this.logger);
    }
  }

  async findOne(id: string): Promise<ProductDocument> {
    try {
      return await this.findByIdOrFail(id);
    } catch (error) {
      throw normalizeHttpError(error, this.logger);
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    newImages: string[],
  ): Promise<ProductDocument> {
    try {
      const product = await this.findByIdOrFail(id);
      Object.assign(product, dto);
      // Replace images only when new files were uploaded.
      if (newImages.length > 0) {
        product.images = newImages;
      }
      return await product.save();
    } catch (error) {
      throw normalizeHttpError(error, this.logger);
    }
  }

  async addImage(id: string, imagePath: string): Promise<ProductDocument> {
    try {
      const product = await this.findByIdOrFail(id);
      product.images.push(imagePath);
      return await product.save();
    } catch (error) {
      throw normalizeHttpError(error, this.logger);
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    try {
      const product = await this.findByIdOrFail(id);
      await this.removeImageFiles(product.images);
      await product.deleteOne();
      return { id };
    } catch (error) {
      throw normalizeHttpError(error, this.logger);
    }
  }

  private async findByIdOrFail(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }
    return product;
  }

  /** Translate filter DTO into a Mongoose query object. */
  private buildConditions(filter: FilterProductDto): ProductFilter {
    const conditions: ProductFilter = { isActive: true };

    if (filter.name) {
      conditions.name = { $regex: this.escapeRegex(filter.name.trim()), $options: 'i' };
    }
    if (filter.category) {
      const normalizedCategory = filter.category.trim();
      conditions.category = {
        $regex: this.buildFuzzyRegex(normalizedCategory),
        $options: 'i',
      };
    }
    if (filter.inStock === true) {
      conditions.stock = { $gt: 0 };
    } else if (filter.inStock === false) {
      conditions.stock = { $lte: 0 };
    }

    const createdAt: Record<string, Date> = {};
    if (filter.createdFrom) {
      createdAt.$gte = new Date(filter.createdFrom);
    }
    if (filter.createdTo) {
      createdAt.$lte = new Date(filter.createdTo);
    }
    if (Object.keys(createdAt).length > 0) {
      conditions.createdAt = createdAt;
    }

    return conditions;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildFuzzyRegex(value: string): string {
    return value
      .split('')
      .map((char) => this.escapeRegex(char))
      .join('.*');
  }

  /** Best-effort deletion of uploaded files when a product is removed. */
  private async removeImageFiles(images: string[]): Promise<void> {
    const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
    await Promise.all(
      images.map(async (webPath) => {
        try {
          const filename = webPath.replace(/^\/uploads\//, '');
          await unlink(join(process.cwd(), uploadDir, filename));
        } catch {
          // File already gone — nothing to clean up.
        }
      }),
    );
  }
}
