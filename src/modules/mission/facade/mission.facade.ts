import { FindByIdUseCaseInterface } from '../usecase/find-by-id/find-by-id.usecase.dto';
import { CreateUseCaseInterface } from '../usecase/create/create.usecase.dto';
import { UpdateUseCaseInterface } from '../usecase/update/update.usecase.dto';
import { SaveVersionUseCaseInterface } from '../usecase/save-version/save-version.usecase.dto';
import { PublishUseCaseInterface } from '../usecase/publish/publish.usecase.dto';
import { ListVersionsUseCaseInterface } from '../usecase/list-versions/list-versions.usecase.dto';
import { GetActiveUseCaseInterface } from '../usecase/get-active/get-active.usecase.dto';
import {
  CreateFacadeInputDto,
  CreateFacadeOutputDto,
  FindByIdFacadeInputDto,
  FindByIdFacadeOutputDto,
  GetActiveFacadeInputDto,
  GetActiveFacadeOutputDto,
  ListVersionsFacadeInputDto,
  ListVersionsFacadeOutputDto,
  MissionFacadeInterface,
  PublishFacadeInputDto,
  PublishFacadeOutputDto,
  SaveVersionFacadeInputDto,
  SaveVersionFacadeOutputDto,
  UpdateFacadeInputDto,
} from './mission.facade.dto';

export default class MissionFacade implements MissionFacadeInterface {
  constructor(
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly createUseCase: CreateUseCaseInterface,
    private readonly updateUseCase: UpdateUseCaseInterface,
    private readonly saveVersionUseCase: SaveVersionUseCaseInterface,
    private readonly publishUseCase: PublishUseCaseInterface,
    private readonly listVersionsUseCase: ListVersionsUseCaseInterface,
    private readonly getActiveUseCase: GetActiveUseCaseInterface,
  ) {}

  async findById(
    data: FindByIdFacadeInputDto,
  ): Promise<FindByIdFacadeOutputDto> {
    const mission = await this.findByIdUseCase.execute(data);
    return mission.toJSON();
  }

  async create(data: CreateFacadeInputDto): Promise<CreateFacadeOutputDto> {
    return this.createUseCase.execute(data);
  }

  async update(data: UpdateFacadeInputDto): Promise<void> {
    return this.updateUseCase.execute(data);
  }

  async saveVersion(
    data: SaveVersionFacadeInputDto,
  ): Promise<SaveVersionFacadeOutputDto> {
    return this.saveVersionUseCase.execute(data);
  }

  async publish(data: PublishFacadeInputDto): Promise<PublishFacadeOutputDto> {
    return this.publishUseCase.execute(data);
  }

  async listVersions(
    data: ListVersionsFacadeInputDto,
  ): Promise<ListVersionsFacadeOutputDto> {
    return this.listVersionsUseCase.execute(data);
  }

  async getActive(
    data: GetActiveFacadeInputDto,
  ): Promise<GetActiveFacadeOutputDto> {
    return this.getActiveUseCase.execute(data);
  }
}
