import { Length, Matches } from 'class-validator';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import { Organization } from '../organization.entity';

export class OrganizationRules {
  @Length(2, 255, {
    message: 'Invalid name',
    groups: ['create', 'name', 'update'],
  })
  name: string;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
    groups: ['create', 'slug', 'update'],
  })
  @Length(3, 63, {
    message: 'Slug must be between 3 and 63 characters',
    groups: ['create', 'slug', 'update'],
  })
  slug: string;

  constructor(data: Organization) {
    Object.assign(this, data.toJSON());
  }
}

export class OrganizationValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: Organization,
    fields: string[],
  ): boolean {
    const rules = new OrganizationRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class OrganizationValidatorFactory {
  static create(): OrganizationValidator {
    return new OrganizationValidator();
  }
}