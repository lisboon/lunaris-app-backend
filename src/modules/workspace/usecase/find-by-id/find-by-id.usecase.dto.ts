import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { Workspace } from '../../domain/workspace.entity';

export interface FindByIdUseCaseInputDto {
  id: string;
  organizationId: string;
}

export interface FindByIdUseCaseInterface extends BaseUseCase<
  FindByIdUseCaseInputDto,
  Workspace
> {
  execute(data: FindByIdUseCaseInputDto): Promise<Workspace>;
}
