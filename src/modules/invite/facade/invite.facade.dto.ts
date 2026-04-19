import { MemberRole, InviteStatus } from '@/modules/@shared/domain/enums';

export interface InviteDto {
  id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  token: string;
  organizationId: string;
  invitedById: string;
  expiresAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateInviteFacadeInputDto {
  email: string;
  role: MemberRole;
  organizationId: string;
  invitedById: string;
}
export interface CreateInviteFacadeOutputDto {
  id: string;
  email: string;
  role: MemberRole;
  organizationId: string;
  token: string;
  expiresAt: Date;
}

export interface AcceptInviteFacadeInputDto {
  token: string;
  name?: string;
  password: string;
}
export interface AcceptInviteFacadeOutputDto {
  userId: string;
  memberId: string;
  organizationId: string;
}

export interface CancelInviteFacadeInputDto {
  id: string;
  organizationId: string;
}

export interface ListInvitesFacadeInputDto {
  organizationId: string;
}
export type ListInvitesFacadeOutputDto = object[];

export interface ResendInviteFacadeInputDto {
  id: string;
  organizationId: string;
}

export interface InviteFacadeInterface {
  create(data: CreateInviteFacadeInputDto): Promise<CreateInviteFacadeOutputDto>;
  accept(data: AcceptInviteFacadeInputDto): Promise<AcceptInviteFacadeOutputDto>;
  cancel(data: CancelInviteFacadeInputDto): Promise<void>;
  list(data: ListInvitesFacadeInputDto): Promise<ListInvitesFacadeOutputDto>;
  resend(data: ResendInviteFacadeInputDto): Promise<void>;
}
