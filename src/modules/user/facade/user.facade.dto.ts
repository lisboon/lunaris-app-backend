import { MemberRole } from '@/modules/@shared/domain/enums';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface RegisterFacadeInputDto {
  email: string;
  name: string;
  password: string;
  organizationName: string;
  organizationSlug: string;
}
export interface RegisterFacadeOutputDto {
  user: { id: string; email: string; name: string };
  organization: { id: string; name: string; slug: string };
  member: { id: string; role: MemberRole };
}

export interface LoginFacadeInputDto {
  email: string;
  password: string;
}
export interface LoginFacadeOutputDto {
  accessToken: string;
  user: { id: string; email: string; name: string };
  organization: { id: string; name: string; slug: string };
  role: MemberRole;
}

export interface FindByIdFacadeInputDto {
  id: string;
}
export type FindByIdFacadeOutputDto = UserDto;

export interface UserFacadeInterface {
  register(data: RegisterFacadeInputDto): Promise<RegisterFacadeOutputDto>;
  login(data: LoginFacadeInputDto): Promise<LoginFacadeOutputDto>;
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
}
