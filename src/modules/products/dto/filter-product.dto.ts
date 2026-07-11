import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Query parameters for GET /api/products. Everything is optional; only the
 * provided filters are applied.
 */
export class FilterProductDto {
  // Filter by name — partial, case-insensitive match.
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  // Filter by created date range (ISO strings, e.g. 2026-07-01).
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  createdTo?: string;

  // Filter by stock availability. `?inStock=true` => stock > 0, `false` => 0.
  @IsOptional()
  @Transform(({ value }): boolean | undefined =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  inStock?: boolean;

  // Pagination.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

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
