import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Query parameters for GET /api/products. Everything is optional; only the
 * provided filters are applied.
 */
export class FilterProductDto {
  // Filter by name — partial, case-insensitive match.
  @ApiPropertyOptional({ example: 'phone', description: 'Partial product name to match.' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Electronics', description: 'Category name to filter products.' })
  @IsOptional()
  @IsString()
  category?: string;

  // Filter by created date range (ISO strings, e.g. 2026-07-01).
  @ApiPropertyOptional({ example: '2026-07-01', description: 'Filter products created after this date.' })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'Filter products created before this date.' })
  @IsOptional()
  @IsString()
  createdTo?: string;

  // Filter by stock availability. `?inStock=true` => stock > 0, `false` => 0.
  @ApiPropertyOptional({ example: true, description: 'Show only products with stock > 0.' })
  @IsOptional()
  @Transform(({ value }): boolean | undefined =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  inStock?: boolean;

  // Pagination.
  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 8, description: 'Number of products per page.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  // Sorting.
  @IsOptional()
  @IsIn(['name', 'price', 'stock', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
