import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { SearchResult } from '@/modules/@shared/repository/search-result';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DAGValidationErrors,
} from '../../types/mission.types';

export class ListVersionsInputDto {
  @IsString({ message: 'The missionId must be text' })
  @IsNotEmpty({ message: 'The missionId is required' })
  missionId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'The page must be an integer' })
  @Min(1, { message: 'The page must be >= 1' })
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'The perPage must be an integer' })
  @Min(1, { message: 'The perPage must be >= 1' })
  @Max(100, { message: 'The perPage must be <= 100' })
  perPage?: number;
}

export interface MissionVersionSummaryDto {
  id: string;
  missionId: string;
  hash: string;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  authorId: string;
  createdAt: Date;
}

export type ListVersionsOutputDto = SearchResult<MissionVersionSummaryDto>;

export interface ListVersionsUseCaseInterface
  extends BaseUseCase<ListVersionsInputDto, ListVersionsOutputDto> {
  execute(input: ListVersionsInputDto): Promise<ListVersionsOutputDto>;
}
