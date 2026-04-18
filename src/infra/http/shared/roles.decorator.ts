import { Reflector } from '@nestjs/core';
import { MemberRole } from '@/modules/@shared/domain/enums';

export interface RolePermission {
  role: MemberRole;
}

export const Roles = Reflector.createDecorator<RolePermission>();
