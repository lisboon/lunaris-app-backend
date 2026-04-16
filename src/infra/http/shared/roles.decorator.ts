import { Reflector } from '@nestjs/core';

export interface RolePermission {
  role: 'ADMIN' | 'DESIGNER' | 'VIEWER';
}

export const Roles = Reflector.createDecorator<RolePermission>();
