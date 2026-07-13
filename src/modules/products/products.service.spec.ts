import { ProductsService } from './products.service';
import { FilterProductDto } from './dto/filter-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productModel: any;

  beforeEach(() => {
    productModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockReturnThis(),
    };

    service = new ProductsService(productModel as never);
  });

  it('should apply a case-insensitive fuzzy category filter', () => {
    const conditions = (service as any).buildConditions({
      category: 'Elec',
    } as FilterProductDto);

    expect(conditions).toMatchObject({
      isActive: true,
      category: { $options: 'i' },
    });
    expect(conditions.category.$regex).toBe('E.*l.*e.*c');
  });

  it('should match category when a character is missing from the query', () => {
    const conditions = (service as any).buildConditions({
      category: 'Elecronics',
    } as FilterProductDto);

    expect(conditions.category.$regex).toBe('E.*l.*e.*c.*r.*o.*n.*i.*c.*s');
  });
});
