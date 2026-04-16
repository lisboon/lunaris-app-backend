import BaseUseCase from '@/modules/@shared/usecase/base.usecase';

export interface RevokeUseCaseInputDto {
  id: string;
  organizationId: string;
}

export interface RevokeUseCaseInterface
  extends BaseUseCase<RevokeUseCaseInputDto, void> {
  execute(input: RevokeUseCaseInputDto): Promise<void>;
}
