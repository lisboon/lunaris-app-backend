import { IsUUID, Length } from 'class-validator';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import { Workspace } from '../workspace.entity';

export class WorkspaceRules {
  @Length(2, 100, {
    message: 'Invalid name',
    groups: ['create', 'name', 'update'],
  })
  name: string;

  @IsUUID('4', {
    message: 'Invalid organization',
    groups: ['create', 'organizationId', 'update'],
  })
  organizationId: string;

  constructor(data: Workspace) {
    Object.assign(this, data.toJSON());
  }
}

export class WorkspaceValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: Workspace,
    fields: string[],
  ): boolean {
    const rules = new WorkspaceRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class WorkspaceValidatorFactory {
  static create(): WorkspaceValidator {
    return new WorkspaceValidator();
  }
}
