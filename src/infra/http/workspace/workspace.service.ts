import { Inject, Injectable } from '@nestjs/common';
import WorkspaceFacade from '@/modules/workspace/facade/workspace.facade';
import {
  CreateFacadeInputDto,
  DeleteFacadeInputDto,
  FindByIdFacadeInputDto,
  SearchFacadeInputDto,
  UpdateFacadeInputDto,
} from '@/modules/workspace/facade/workspace.facade.dto';

@Injectable()
export class WorkspaceService {
  @Inject(WorkspaceFacade)
  private readonly workspaceFacade: WorkspaceFacade;

  async findById(input: FindByIdFacadeInputDto) {
    return this.workspaceFacade.findById(input);
  }

  async create(input: CreateFacadeInputDto) {
    return this.workspaceFacade.create(input);
  }

  async search(input: SearchFacadeInputDto) {
    return this.workspaceFacade.search(input);
  }

  async update(input: UpdateFacadeInputDto) {
    return this.workspaceFacade.update(input);
  }

  async delete(input: DeleteFacadeInputDto) {
    return this.workspaceFacade.delete(input);
  }
}
