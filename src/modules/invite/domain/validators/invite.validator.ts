import { IsEmail, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { Invite } from '../invite.entity';

export class InviteRules {
  @IsEmail({}, {
    message: 'Invalid email',
    groups: ['create', 'email'],
  })
  email: string;

  @IsEnum(MemberRole, {
    message: 'Invalid role',
    groups: ['create', 'role'],
  })
  role: MemberRole;

  @IsNotEmpty({
    message: 'Token is required',
    groups: ['create', 'token'],
  })
  token: string;

  @IsUUID('4', {
    message: 'Invalid organizationId',
    groups: ['create', 'organizationId'],
  })
  organizationId: string;

  @IsUUID('4', {
    message: 'Invalid invitedById',
    groups: ['create', 'invitedById'],
  })
  invitedById: string;

  constructor(data: Invite) {
    this.email = data.email;
    this.role = data.role;
    this.token = data.token;
    this.organizationId = data.organizationId;
    this.invitedById = data.invitedById;
  }
}

export class InviteValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: Invite,
    fields: string[],
  ): boolean {
    const rules = new InviteRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class InviteValidatorFactory {
  static create(): InviteValidator {
    return new InviteValidator();
  }
}
