import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @IsString({ message: 'The name must be text' })
  @IsOptional()
  name?: string;
}

export interface UpdateUseCaseInterface extends BaseUseCase<
  UpdateUseCaseInputDto,
  void
> {
  execute(input: UpdateUseCaseInputDto): Promise<void>;
}
