import { ApiKeyGateway } from '../../gateway/engine.gateway';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  RevokeUseCaseInputDto,
  RevokeUseCaseInterface,
} from './revoke.usecase.dto';

export default class RevokeUseCase implements RevokeUseCaseInterface {
  constructor(
    private readonly apiKeyRepository: ApiKeyGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: RevokeUseCaseInputDto): Promise<void> {
    const apiKey = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    if (apiKey.isRevoked()) {
      throw new EntityValidationError([
        { field: 'id', message: 'API Key is already revoked' },
      ]);
    }

    apiKey.revoke();
    await this.apiKeyRepository.update(apiKey);
  }
}
