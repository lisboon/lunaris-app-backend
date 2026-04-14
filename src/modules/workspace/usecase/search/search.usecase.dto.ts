import { SortDirection } from '@/modules/@shared/repository/search-params';
import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  SearchFacadeOutputDto,
  WorkspaceDto,
} from '../../facade/workspace.facade.dto';

export class SearchUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @IsString({ message: 'Invalid name' })
  @IsOptional()
  name?: string;

  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'Invalid active status' })
  @IsOptional()
  active?: boolean;

  @IsString({ message: 'Invalid sort field' })
  @IsOptional()
  sort?: string;

  @IsString({ message: 'Invalid sort direction' })
  @IsOptional()
  sortDir?: SortDirection;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Invalid page' })
  @IsOptional()
  page?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Invalid items per page' })
  @IsOptional()
  perPage?: number;
}

export type SearchUseCaseItems = WorkspaceDto;
export type SearchUseCaseOutputDto = SearchFacadeOutputDto;

export interface SearchUseCaseInterface extends BaseUseCase<
  SearchUseCaseInputDto,
  SearchUseCaseOutputDto
> {
  execute(data: SearchUseCaseInputDto): Promise<SearchUseCaseOutputDto>;
}
