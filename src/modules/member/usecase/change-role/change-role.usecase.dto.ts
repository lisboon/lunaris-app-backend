import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsEnum, IsUUID } from 'class-validator';
import { MemberRole } from '@/modules/@shared/domain/enums';

export class ChangeRoleUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @IsEnum(MemberRole, { message: 'Invalid role' })
  role: MemberRole;
}

export interface ChangeRoleUseCaseInterface
  extends BaseUseCase<ChangeRoleUseCaseInputDto, void> {
  execute(input: ChangeRoleUseCaseInputDto): Promise<void>;
}
