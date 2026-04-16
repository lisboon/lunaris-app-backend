import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateUseCaseInputDto {
  @ApiProperty({
    description: 'Display name of the API Key (shown in the dashboard)',
    example: 'Unreal Plugin - Production',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Invalid name' })
  @Length(2, 100, { message: 'Invalid name' })
  name: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @ApiPropertyOptional({
    description:
      'Expiration date (ISO 8601). If omitted, the key never expires.',
    example: '2026-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Invalid expiration date' })
  expiresAt?: Date | null;
}

export interface CreateUseCaseOutputDto {
  id: string;
  name: string;
  prefix: string;
  rawKey: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateUseCaseInterface
  extends BaseUseCase<CreateUseCaseInputDto, CreateUseCaseOutputDto> {
  execute(input: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto>;
}
