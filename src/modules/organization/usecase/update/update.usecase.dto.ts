import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class UpdateUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsString({ message: 'The name must be text' })
  @IsOptional()
  name?: string;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  @Length(3, 63, { message: 'Slug must be between 3 and 63 characters' })
  @IsOptional()
  slug?: string;
}

export interface UpdateUseCaseInterface
  extends BaseUseCase<UpdateUseCaseInputDto, void> {
  execute(input: UpdateUseCaseInputDto): Promise<void>;
}