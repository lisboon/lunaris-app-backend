import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { SortDirection } from '@/modules/@shared/repository/search-params';

export class SearchWorkspacesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by partial name match' })
  @IsOptional()
  @IsString({ message: 'Invalid name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by active flag', type: Boolean })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'Invalid active status' })
  active?: boolean;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString({ message: 'Invalid sort field' })
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString({ message: 'Invalid sort direction' })
  sortDir?: SortDirection;

  @ApiPropertyOptional({ description: '1-indexed page', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Invalid page' })
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Invalid items per page' })
  perPage?: number;
}
