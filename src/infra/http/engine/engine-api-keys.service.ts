import { Inject, Injectable } from '@nestjs/common';
import ApiKeyFacade from '@/modules/engine/facade/engine.facade';
import { CreateUseCaseInputDto } from '@/modules/engine/usecase/create/create.usecase.dto';
import { SearchUseCaseInputDto } from '@/modules/engine/usecase/search/search.usecase.dto';
import { RevokeUseCaseInputDto } from '@/modules/engine/usecase/revoke/revoke.usecase.dto';

@Injectable()
export class EngineApiKeysService {
  @Inject(ApiKeyFacade)
  private readonly apiKeyFacade: ApiKeyFacade;

  async create(input: CreateUseCaseInputDto) {
    return this.apiKeyFacade.create(input);
  }

  async search(input: SearchUseCaseInputDto) {
    return this.apiKeyFacade.search(input);
  }

  async revoke(input: RevokeUseCaseInputDto) {
    return this.apiKeyFacade.revoke(input);
  }
}
