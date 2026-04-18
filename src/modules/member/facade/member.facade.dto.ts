import { MemberRole } from '@/modules/@shared/domain/enums';

export interface MemberDto {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface FindByIdFacadeInputDto {
  id: string;
  organizationId: string;
}
export type FindByIdFacadeOutputDto = MemberDto;

export interface ListByOrganizationFacadeInputDto {
  organizationId: string;
}
export interface MemberSummaryDto {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type ListByOrganizationFacadeOutputDto = MemberSummaryDto[];

export interface ChangeRoleFacadeInputDto {
  id: string;
  organizationId: string;
  role: MemberRole;
}

export interface RemoveMemberFacadeInputDto {
  id: string;
  organizationId: string;
}

export interface MemberFacadeInterface {
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
  listByOrganization(data: ListByOrganizationFacadeInputDto): Promise<ListByOrganizationFacadeOutputDto>;
  changeRole(data: ChangeRoleFacadeInputDto): Promise<void>;
  remove(data: RemoveMemberFacadeInputDto): Promise<void>;
}
