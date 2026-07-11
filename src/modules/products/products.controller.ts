import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MESSAGES, ROLES, UPLOAD } from '../../common/constants/app.constants';
import {
  filesToPaths,
  multerImageOptions,
} from '../../common/config/multer.config';

// Every route requires a valid JWT; write routes additionally require 'admin'.
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // POST /api/products — create with 0..N images (multipart field: "images").
  @Post()
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('images', UPLOAD.MAX_FILES, multerImageOptions),
  )
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.productsService.create(
      dto,
      filesToPaths(files),
      userId,
    );
    return { success: true, message: MESSAGES.PRODUCT.CREATED, data };
  }

  // GET /api/products — filter (name / date / stock) + sort + paginate.
  @Get()
  async findAll(@Query() filter: FilterProductDto) {
    const data = await this.productsService.findAll(filter);
    return { success: true, message: MESSAGES.PRODUCT.FETCHED, data };
  }

  // GET /api/products/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return { success: true, message: MESSAGES.PRODUCT.FETCHED_ONE, data };
  }

  // PATCH /api/products/:id — update fields; replaces images if new ones sent.
  @Patch(':id')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', UPLOAD.MAX_FILES, multerImageOptions),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ) {
    const data = await this.productsService.update(
      id,
      dto,
      filesToPaths(files),
    );
    return { success: true, message: MESSAGES.PRODUCT.UPDATED, data };
  }

  // POST /api/products/:id/image — single image upload (multipart field: "image").
  @Post(':id/image')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerImageOptions))
  async uploadSingle(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const path = file ? `/uploads/${file.filename}` : '';
    const data = await this.productsService.addImage(id, path);
    return { success: true, message: MESSAGES.PRODUCT.UPDATED, data };
  }

  // DELETE /api/products/:id
  @Delete(':id')
  @Roles(ROLES.ADMIN)
  async remove(@Param('id') id: string) {
    const data = await this.productsService.remove(id);
    return { success: true, message: MESSAGES.PRODUCT.DELETED, data };
  }
}
