import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { Organization } from '../../domain/organization.entity';

export interface FindByIdUseCaseInputDto {
  id: string;
}

export interface FindByIdUseCaseInterface
  extends BaseUseCase<FindByIdUseCaseInputDto, Organization> {
  execute(data: FindByIdUseCaseInputDto): Promise<Organization>;
}
