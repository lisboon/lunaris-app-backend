import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { ApiKey } from '../../domain/engine.entity';

export interface FindByIdUseCaseInputDto {
  id: string;
  organizationId: string;
}

export interface FindByIdUseCaseInterface
  extends BaseUseCase<FindByIdUseCaseInputDto, ApiKey> {
  execute(data: FindByIdUseCaseInputDto): Promise<ApiKey>;
}
