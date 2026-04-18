import BaseUseCase from '@/modules/@shared/usecase/base.usecase';

export interface ListByOrganizationUseCaseInputDto {
  organizationId: string;
}

export type MemberSummaryDto = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export interface ListByOrganizationUseCaseInterface
  extends BaseUseCase<
    ListByOrganizationUseCaseInputDto,
    MemberSummaryDto[]
  > {
  execute(
    data: ListByOrganizationUseCaseInputDto,
  ): Promise<MemberSummaryDto[]>;
}
