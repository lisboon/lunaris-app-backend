import { IsEnum, IsUUID } from 'class-validator';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { Member } from '../member.entity';

export class MemberRules {
  @IsUUID('4', {
    message: 'Invalid userId',
    groups: ['create', 'userId'],
  })
  userId: string;

  @IsUUID('4', {
    message: 'Invalid organizationId',
    groups: ['create', 'organizationId'],
  })
  organizationId: string;

  @IsEnum(MemberRole, {
    message: 'Invalid role',
    groups: ['create', 'role', 'update'],
  })
  role: MemberRole;

  constructor(data: Member) {
    Object.assign(this, data.toJSON());
  }
}

export class MemberValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: Member,
    fields: string[],
  ): boolean {
    const rules = new MemberRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class MemberValidatorFactory {
  static create(): MemberValidator {
    return new MemberValidator();
  }
}
