import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { MissionStatus } from '@/modules/@shared/domain/enums';

export class CreateUseCaseInputDto {
  @ApiProperty({
    description:
      'Unique mission identifier in snake_case. Must start with a letter and contain only lowercase letters, digits and underscores.',
    example: 'qst_old_country',
    pattern: '^[a-z][a-z0-9_]*$',
  })
  @IsString({ message: 'The mission id must be text' })
  @IsNotEmpty({ message: 'The mission id is required' })
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'The id must be snake_case and start with a letter (e.g. qst_old_country)',
  })
  id: string;

  @ApiProperty({
    description: 'Human-readable mission name',
    example: 'The Old Country',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'The name must be text' })
  @IsNotEmpty({ message: 'The mission name is required' })
  @Length(2, 100, { message: 'The name must be between 2 and 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed mission description',
    example: 'Opening mission of the sertão biome, introduces factions.',
  })
  @IsOptional()
  @IsString({ message: 'The description must be text' })
  description?: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid workspace' })
  workspaceId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid author' })
  authorId: string;
}

export interface CreateUseCaseOutputDto {
  id: string;
  name: string;
  description: string | null;
  status: MissionStatus;
  activeHash: string | null;
  organizationId: string;
  workspaceId: string;
  authorId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | undefined;
}

export interface CreateUseCaseInterface
  extends BaseUseCase<CreateUseCaseInputDto, CreateUseCaseOutputDto> {
  execute(input: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto>;
}
