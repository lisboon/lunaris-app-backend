import BaseUseCase from '@/modules/@shared/usecase/base.usecase';

export interface ListInvitesUseCaseInputDto {
  organizationId: string;
}

export interface ListInvitesUseCaseInterface
  extends BaseUseCase<ListInvitesUseCaseInputDto, object[]> {
  execute(data: ListInvitesUseCaseInputDto): Promise<object[]>;
}
