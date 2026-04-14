import { Workspace } from '../../domain/workspace.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { WorkspaceGateway } from '../../gateway/workspace.gateway';
import {
  CreateUseCaseInputDto,
  CreateUseCaseInterface,
  CreateUseCaseOutputDto,
} from './create.usecase.dto';

export default class CreateUseCase implements CreateUseCaseInterface {
  constructor(private readonly workspaceRepository: WorkspaceGateway) {}

  async execute(data: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto> {
    const duplicate = await this.workspaceRepository.findByName(
      data.name,
      data.organizationId,
    );

    if (duplicate) {
      throw new EntityValidationError([
        { field: 'name', message: 'Workspace already registered' },
      ]);
    }

    const workspace = Workspace.create(data);
    await this.workspaceRepository.create(workspace);

    return workspace.toJSON();
  }
}
