import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder, Types } from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';
import PDFDocument from 'pdfkit';
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

interface ProductExportRow {
  name: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageCount: number;
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

  async exportPdf(filter: FilterProductDto): Promise<Buffer> {
    try {
      const items = await this.findProductsForExport(filter);
      return await this.buildProductsPdf(items, filter);
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

  private async findProductsForExport(
    filter: FilterProductDto,
  ): Promise<ProductDocument[]> {
    const conditions = this.buildConditions(filter);
    const sortBy = filter.sortBy ?? DEFAULTS.SORT_BY;
    const sortOrder: SortOrder =
      (filter.sortOrder ?? DEFAULTS.SORT_ORDER) === 'asc' ? 1 : -1;

    return await this.productModel
      .find(conditions)
      .sort({ [sortBy]: sortOrder })
      .exec();
  }

  private async buildProductsPdf(
    products: ProductDocument[],
    filter: FilterProductDto,
  ): Promise<Buffer> {
    const rows = products.map((product) => ({
      name: product.name,
      category: product.category || '-',
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
      imageCount: product.images?.length ?? 0,
    }));

    return await new Promise<Buffer>((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      this.writePdfHeader(document, rows.length, filter);
      this.writePdfTable(document, rows);

      document.end();
    });
  }

  private writePdfHeader(
    document: InstanceType<typeof PDFDocument>,
    totalItems: number,
    filter: FilterProductDto,
  ): void {
    document.fontSize(18).text('Products Export', { align: 'center' });
    document.moveDown(0.5);
    document.fontSize(10).fillColor('#555555');
    document.text(`Generated at: ${new Date().toISOString()}`);

    const activeFilters = [
      filter.name ? `Name: ${filter.name}` : null,
      filter.category ? `Category: ${filter.category}` : null,
      filter.createdFrom ? `From: ${filter.createdFrom}` : null,
      filter.createdTo ? `To: ${filter.createdTo}` : null,
      filter.inStock === true
        ? 'Stock: in stock only'
        : filter.inStock === false
          ? 'Stock: out of stock only'
          : null,
    ].filter(Boolean) as string[];

    if (activeFilters.length > 0) {
      document.text(`Filters: ${activeFilters.join(' | ')}`);
    }

    document.text(`Total products: ${totalItems}`);
    document.moveDown(1);
    document.fillColor('#000000');
  }

  private writePdfTable(
    document: InstanceType<typeof PDFDocument>,
    rows: ProductExportRow[],
  ): void {
    const pageLeft = document.page.margins.left;
    const pageRight = document.page.width - document.page.margins.right;
    const colWidths = {
      name: 140,
      category: 100,
      price: 65,
      stock: 55,
      status: 70,
      images: 60,
    };
    const tableWidth =
      colWidths.name +
      colWidths.category +
      colWidths.price +
      colWidths.stock +
      colWidths.status +
      colWidths.images;

    const startX = pageLeft;
    let currentY = document.y;
    const rowHeight = 22;

    const drawHeader = (): void => {
      document
        .fontSize(10)
        .fillColor('#111111')
        .rect(startX, currentY, tableWidth, rowHeight)
        .stroke();
      document.text('Name', startX + 4, currentY + 6, {
        width: colWidths.name - 8,
      });
      document.text('Category', startX + colWidths.name + 4, currentY + 6, {
        width: colWidths.category - 8,
      });
      document.text(
        'Price',
        startX + colWidths.name + colWidths.category + 4,
        currentY + 6,
        { width: colWidths.price - 8 },
      );
      document.text(
        'Stock',
        startX + colWidths.name + colWidths.category + colWidths.price + 4,
        currentY + 6,
        { width: colWidths.stock - 8 },
      );
      document.text(
        'Status',
        startX +
          colWidths.name +
          colWidths.category +
          colWidths.price +
          colWidths.stock +
          4,
        currentY + 6,
        { width: colWidths.status - 8 },
      );
      document.text(
        'Images',
        startX +
          colWidths.name +
          colWidths.category +
          colWidths.price +
          colWidths.stock +
          colWidths.status +
          4,
        currentY + 6,
        { width: colWidths.images - 8 },
      );
      currentY += rowHeight;
    };

    const ensureSpace = (): void => {
      if (currentY + rowHeight > document.page.height - document.page.margins.bottom) {
        document.addPage();
        currentY = document.page.margins.top;
        drawHeader();
      }
    };

    drawHeader();

    rows.forEach((row) => {
      ensureSpace();
      document
        .fontSize(9)
        .rect(startX, currentY, tableWidth, rowHeight)
        .stroke();
      document.text(row.name, startX + 4, currentY + 6, {
        width: colWidths.name - 8,
      });
      document.text(row.category, startX + colWidths.name + 4, currentY + 6, {
        width: colWidths.category - 8,
      });
      document.text(`$${row.price.toFixed(2)}`, startX + colWidths.name + colWidths.category + 4, currentY + 6, {
        width: colWidths.price - 8,
      });
      document.text(
        String(row.stock),
        startX + colWidths.name + colWidths.category + colWidths.price + 4,
        currentY + 6,
        { width: colWidths.stock - 8 },
      );
      document.text(
        row.isActive ? 'Active' : 'Inactive',
        startX +
          colWidths.name +
          colWidths.category +
          colWidths.price +
          colWidths.stock +
          4,
        currentY + 6,
        { width: colWidths.status - 8 },
      );
      document.text(
        String(row.imageCount),
        startX +
          colWidths.name +
          colWidths.category +
          colWidths.price +
          colWidths.stock +
          colWidths.status +
          4,
        currentY + 6,
        { width: colWidths.images - 8 },
      );
      currentY += rowHeight;
    });

    const footerY = Math.min(
      currentY + 10,
      document.page.height - document.page.margins.bottom - 20,
    );
    document
      .fontSize(8)
      .fillColor('#555555')
      .text(`End of export`, startX, footerY, {
        width: pageRight - pageLeft,
        align: 'center',
      });
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
