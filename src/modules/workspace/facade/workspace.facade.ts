import { FindByIdUseCaseInterface } from '../usecase/find-by-id/find-by-id.usecase.dto';
import {
  WorkspaceFacadeInterface,
  CreateFacadeInputDto,
  CreateFacadeOutputDto,
  DeleteFacadeInputDto,
  FindByIdFacadeInputDto,
  FindByIdFacadeOutputDto,
  SearchFacadeInputDto,
  SearchFacadeOutputDto,
  UpdateFacadeInputDto,
} from './workspace.facade.dto';
import { CreateUseCaseInterface } from '../usecase/create/create.usecase.dto';
import { SearchUseCaseInterface } from '../usecase/search/search.usecase.dto';
import { UpdateUseCaseInterface } from '../usecase/update/update.usecase.dto';
import { DeleteUseCaseInterface } from '../usecase/delete/delete.usecase.dto';

export default class WorkspaceFacade implements WorkspaceFacadeInterface {
  constructor(
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly createUseCase: CreateUseCaseInterface,
    private readonly searchUseCase: SearchUseCaseInterface,
    private readonly updateUseCase: UpdateUseCaseInterface,
    private readonly deleteUseCase: DeleteUseCaseInterface,
  ) {}

  async findById(
    data: FindByIdFacadeInputDto,
  ): Promise<FindByIdFacadeOutputDto> {
    const workspace = await this.findByIdUseCase.execute(data);
    return workspace.toJSON();
  }

  async create(data: CreateFacadeInputDto): Promise<CreateFacadeOutputDto> {
    return this.createUseCase.execute(data);
  }

  async search(data: SearchFacadeInputDto): Promise<SearchFacadeOutputDto> {
    return this.searchUseCase.execute(data);
  }

  async update(data: UpdateFacadeInputDto): Promise<void> {
    return this.updateUseCase.execute(data);
  }

  async delete(data: DeleteFacadeInputDto): Promise<void> {
    return this.deleteUseCase.execute(data);
  }
}
