import { WorkspaceGateway } from '../../gateway/workspace.gateway';
import { Workspace } from '../../domain/workspace.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly workspaceRepository: WorkspaceGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(
      data.id,
      data.organizationId,
    );

    if (!workspace) {
      throw new NotFoundError(data.id, Workspace);
    }

    return workspace;
  }
}
