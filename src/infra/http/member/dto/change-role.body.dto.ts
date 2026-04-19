import { IsEnum } from 'class-validator';
import { MemberRole } from '@/modules/@shared/domain/enums';

export class ChangeRoleBodyDto {
  @IsEnum(MemberRole, { message: 'Invalid role' })
  role: MemberRole;
}
