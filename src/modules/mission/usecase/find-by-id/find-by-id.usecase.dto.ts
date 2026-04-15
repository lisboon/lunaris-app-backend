import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { Mission } from '../../domain/mission.entity';

export interface FindByIdUseCaseInputDto {
  id: string;
  organizationId: string;
}

export interface FindByIdUseCaseInterface
  extends BaseUseCase<FindByIdUseCaseInputDto, Mission> {
  execute(data: FindByIdUseCaseInputDto): Promise<Mission>;
}
