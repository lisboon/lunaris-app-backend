import { ApiKey } from '../../domain/engine.entity';
import { ApiKeyGateway } from '../../gateway/engine.gateway';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly apiKeyRepository: ApiKeyGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findById(
      data.id,
      data.organizationId,
    );

    if (!apiKey) {
      throw new NotFoundError(data.id, ApiKey);
    }

    return apiKey;
  }
}
