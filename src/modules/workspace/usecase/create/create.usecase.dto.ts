import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { WorkspaceDto } from '../../facade/workspace.facade.dto';

export class CreateUseCaseInputDto {
  @IsString({ message: 'The name must be text' })
  @IsNotEmpty({ message: 'The name is required' })
  name: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export type CreateUseCaseOutputDto = WorkspaceDto;

export interface CreateUseCaseInterface extends BaseUseCase<
  CreateUseCaseInputDto,
  CreateUseCaseOutputDto
> {
  execute(data: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto>;
}
