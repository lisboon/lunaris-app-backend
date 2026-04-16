import { FindByIdUseCaseInterface } from '../usecase/find-by-id/find-by-id.usecase.dto';
import { CreateUseCaseInterface } from '../usecase/create/create.usecase.dto';
import { RevokeUseCaseInterface } from '../usecase/revoke/revoke.usecase.dto';
import { SearchUseCaseInterface } from '../usecase/search/search.usecase.dto';
import { ValidateKeyUseCaseInterface } from '../usecase/validate-key/validate-key.usecase.dto';
import {
  ApiKeyFacadeInterface,
  CreateFacadeInputDto,
  CreateFacadeOutputDto,
  FindByIdFacadeInputDto,
  FindByIdFacadeOutputDto,
  RevokeFacadeInputDto,
  SearchFacadeInputDto,
  SearchFacadeOutputDto,
  ValidateKeyFacadeInputDto,
  ValidateKeyFacadeOutputDto,
} from './engine.facade.dto';

export default class ApiKeyFacade implements ApiKeyFacadeInterface {
  constructor(
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly createUseCase: CreateUseCaseInterface,
    private readonly revokeUseCase: RevokeUseCaseInterface,
    private readonly searchUseCase: SearchUseCaseInterface,
    private readonly validateKeyUseCase: ValidateKeyUseCaseInterface,
  ) {}

  async findById(
    data: FindByIdFacadeInputDto,
  ): Promise<FindByIdFacadeOutputDto> {
    const apiKey = await this.findByIdUseCase.execute(data);
    const json = apiKey.toJSON();
    return {
      id: json.id,
      organizationId: json.organizationId,
      name: json.name,
      prefix: json.prefix,
      lastUsedAt: json.lastUsedAt,
      expiresAt: json.expiresAt,
      revokedAt: json.revokedAt,
      active: json.active,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }

  async create(data: CreateFacadeInputDto): Promise<CreateFacadeOutputDto> {
    return this.createUseCase.execute(data);
  }

  async revoke(data: RevokeFacadeInputDto): Promise<void> {
    return this.revokeUseCase.execute(data);
  }

  async search(data: SearchFacadeInputDto): Promise<SearchFacadeOutputDto> {
    return this.searchUseCase.execute(data);
  }

  async validateKey(
    data: ValidateKeyFacadeInputDto,
  ): Promise<ValidateKeyFacadeOutputDto> {
    return this.validateKeyUseCase.execute(data);
  }
}
