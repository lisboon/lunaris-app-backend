import { WorkspaceGateway } from '../../gateway/workspace.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  DeleteUseCaseInputDto,
  DeleteUseCaseInterface,
} from './delete.usecase.dto';

export default class DeleteUseCase implements DeleteUseCaseInterface {
  constructor(
    private readonly workspaceRepository: WorkspaceGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: DeleteUseCaseInputDto): Promise<void> {
    const workspace = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    workspace.delete();

    await this.workspaceRepository.update(workspace);
  }
}
