import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsEmail, IsEnum, IsUUID } from 'class-validator';
import { MemberRole } from '@/modules/@shared/domain/enums';

export class CreateInviteUseCaseInputDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsEnum(MemberRole, { message: 'Invalid role' })
  role: MemberRole;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @IsUUID('4', { message: 'Invalid invitedById' })
  invitedById: string;
}

export interface CreateInviteUseCaseOutputDto {
  id: string;
  email: string;
  role: MemberRole;
  organizationId: string;
  token: string;
  expiresAt: Date;
}

export interface CreateInviteUseCaseInterface
  extends BaseUseCase<CreateInviteUseCaseInputDto, CreateInviteUseCaseOutputDto> {
  execute(
    data: CreateInviteUseCaseInputDto,
  ): Promise<CreateInviteUseCaseOutputDto>;
}
