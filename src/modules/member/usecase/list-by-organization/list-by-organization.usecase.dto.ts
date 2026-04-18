import BaseUseCase from '@/modules/@shared/usecase/base.usecase';

export interface ListByOrganizationInputDto {
  organizationId: string;
}

export interface MemberSummaryDto {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export type ListByOrganizationOutputDto = MemberSummaryDto[];

export interface ListByOrganizationUseCaseInterface
  extends BaseUseCase<ListByOrganizationInputDto, ListByOrganizationOutputDto> {
  execute(input: ListByOrganizationInputDto): Promise<ListByOrganizationOutputDto>;
}