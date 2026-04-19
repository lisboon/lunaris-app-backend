import { IsEmail, IsEnum } from 'class-validator';
import { MemberRole } from '@/modules/@shared/domain/enums';

export class CreateInviteBodyDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsEnum(MemberRole, { message: 'Invalid role' })
  role: MemberRole;
}
