import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class UpdateUseCaseInputDto {
  @IsString({ message: 'The mission id must be text' })
  @IsNotEmpty({ message: 'The mission id is required' })
  id: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'The name must be text' })
  @Length(2, 100, { message: 'The name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'The description must be text' })
  description?: string;
}

export interface UpdateUseCaseInterface
  extends BaseUseCase<UpdateUseCaseInputDto, void> {
  execute(input: UpdateUseCaseInputDto): Promise<void>;
}
