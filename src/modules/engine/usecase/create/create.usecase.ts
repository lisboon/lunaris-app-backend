import { ApiKey } from '../../domain/engine.entity';
import { ApiKeyGateway } from '../../gateway/engine.gateway';
import { ApiKeyHashService } from '../../domain/services/engine-hash.service';
import {
  CreateUseCaseInputDto,
  CreateUseCaseInterface,
  CreateUseCaseOutputDto,
} from './create.usecase.dto';

export default class CreateUseCase implements CreateUseCaseInterface {
  constructor(
    private readonly apiKeyRepository: ApiKeyGateway,
    private readonly hashService: ApiKeyHashService,
  ) {}

  async execute(input: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto> {
    const { rawKey, keyHash, prefix } = this.hashService.generate();

    const apiKey = ApiKey.create({
      organizationId: input.organizationId,
      name: input.name,
      keyHash,
      prefix,
      expiresAt: input.expiresAt ?? null,
    });

    await this.apiKeyRepository.create(apiKey);

    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      rawKey,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }
}
