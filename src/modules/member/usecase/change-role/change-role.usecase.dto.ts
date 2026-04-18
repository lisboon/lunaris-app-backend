import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { IsEnum, IsUUID } from 'class-validator';

export class ChangeRoleInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @IsEnum(MemberRole, { message: 'Invalid role' })
  role: MemberRole;
}

export interface ChangeRoleUseCaseInterface
  extends BaseUseCase<ChangeRoleInputDto, void> {
  execute(input: ChangeRoleInputDto): Promise<void>;
}