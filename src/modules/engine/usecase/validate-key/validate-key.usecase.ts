import { ApiKeyGateway } from '../../gateway/engine.gateway';
import { ApiKeyHashService } from '../../domain/services/engine-hash.service';
import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import {
  ValidateKeyUseCaseInputDto,
  ValidateKeyUseCaseInterface,
  ValidateKeyUseCaseOutputDto,
} from './validate-key.usecase.dto';

export default class ValidateKeyUseCase implements ValidateKeyUseCaseInterface {
  constructor(
    private readonly apiKeyRepository: ApiKeyGateway,
    private readonly hashService: ApiKeyHashService,
  ) {}

  async execute(
    input: ValidateKeyUseCaseInputDto,
  ): Promise<ValidateKeyUseCaseOutputDto> {
    const keyHash = this.hashService.hash(input.rawKey);
    const apiKey = await this.apiKeyRepository.findByHash(keyHash);

    if (!apiKey || apiKey.isRevoked() || apiKey.isExpired()) {
      throw new UnauthorizedError('Invalid or revoked Engine API Key');
    }

    apiKey.touchLastUsed();
    await this.apiKeyRepository.update(apiKey);

    return {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
    };
  }
}
