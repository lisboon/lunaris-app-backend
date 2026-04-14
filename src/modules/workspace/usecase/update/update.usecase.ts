import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  UpdateUseCaseInputDto,
  UpdateUseCaseInterface,
} from './update.usecase.dto';
import { WorkspaceGateway } from '../../gateway/workspace.gateway';

export default class UpdateUseCase implements UpdateUseCaseInterface {
  constructor(
    private readonly workspaceRepository: WorkspaceGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: UpdateUseCaseInputDto): Promise<void> {
    const workspace = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    workspace.updateWorkspace(input);

    await this.workspaceRepository.update(workspace);
  }
}
