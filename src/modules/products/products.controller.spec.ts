import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

const mockProductsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  addImage: jest.fn(),
  remove: jest.fn(),
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a product', async () => {
    const dto: CreateProductDto = {
      name: 'Test Product',
      description: 'Product description',
      price: 100,
      category: 'Test',
      stock: 10,
      isActive: true,
    };

    const product = { id: '1', ...dto };
    mockProductsService.create.mockResolvedValue(product);

    expect(await controller.create(dto, undefined, 'user-id')).toEqual({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
    expect(mockProductsService.create).toHaveBeenCalledWith(dto, [], 'user-id');
  });

  it('should fetch all products', async () => {
    const filter: FilterProductDto = {};
    const result = { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    mockProductsService.findAll.mockResolvedValue(result);

    expect(await controller.findAll(filter)).toEqual({
      success: true,
      message: 'Products fetched successfully',
      data: result,
    });
    expect(mockProductsService.findAll).toHaveBeenCalledWith(filter);
  });

  it('should fetch a product by id', async () => {
    const id = '1';
    const product = { id, name: 'Test Product' };
    mockProductsService.findOne.mockResolvedValue(product);

    expect(await controller.findOne(id)).toEqual({
      success: true,
      message: 'Product fetched successfully',
      data: product,
    });
    expect(mockProductsService.findOne).toHaveBeenCalledWith(id);
  });

  it('should update a product', async () => {
    const id = '1';
    const dto: UpdateProductDto = { price: 150 };
    const product = { id, price: 150 };
    mockProductsService.update.mockResolvedValue(product);

    expect(await controller.update(id, dto, undefined)).toEqual({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
    expect(mockProductsService.update).toHaveBeenCalledWith(id, dto, []);
  });

  it('should upload single image', async () => {
    const id = '1';
    const file = { filename: 'image.jpg' } as Express.Multer.File;
    const product = { id, images: ['/uploads/image.jpg'] };
    mockProductsService.addImage.mockResolvedValue(product);

    expect(await controller.uploadSingle(id, file)).toEqual({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
    expect(mockProductsService.addImage).toHaveBeenCalledWith(
      id,
      '/uploads/image.jpg',
    );
  });

  it('should remove a product', async () => {
    const id = '1';
    const result = { id };
    mockProductsService.remove.mockResolvedValue(result);

    expect(await controller.remove(id)).toEqual({
      success: true,
      message: 'Product deleted successfully',
      data: result,
    });
    expect(mockProductsService.remove).toHaveBeenCalledWith(id);
  });
});
