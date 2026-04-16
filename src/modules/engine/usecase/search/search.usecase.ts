import { ApiKeyGateway } from '../../gateway/engine.gateway';
import {
  SearchUseCaseInputDto,
  SearchUseCaseInterface,
  SearchUseCaseOutputDto,
} from './search.usecase.dto';

export default class SearchUseCase implements SearchUseCaseInterface {
  constructor(private readonly apiKeyRepository: ApiKeyGateway) {}

  async execute(
    input: SearchUseCaseInputDto,
  ): Promise<SearchUseCaseOutputDto> {
    const keys = await this.apiKeyRepository.findByOrganization(
      input.organizationId,
    );

    return {
      items: keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        revokedAt: key.revokedAt,
        createdAt: key.createdAt,
      })),
      total: keys.length,
    };
  }
}
