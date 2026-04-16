import { IsUUID, Length, Matches } from 'class-validator';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import { ApiKey } from '../engine.entity';

export class ApiKeyRules {
  @Length(2, 100, {
    message: 'Invalid name',
    groups: ['create', 'name', 'update'],
  })
  name: string;

  @IsUUID('4', {
    message: 'Invalid organization',
    groups: ['create', 'organizationId'],
  })
  organizationId: string;

  @Matches(/^[a-f0-9]{64}$/, {
    message: 'Invalid key hash',
    groups: ['create', 'keyHash'],
  })
  keyHash: string;

  @Length(8, 32, {
    message: 'Invalid prefix',
    groups: ['create', 'prefix'],
  })
  prefix: string;

  constructor(data: ApiKey) {
    Object.assign(this, data.toJSON());
  }
}

export class ApiKeyValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: ApiKey,
    fields: string[],
  ): boolean {
    const rules = new ApiKeyRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class ApiKeyValidatorFactory {
  static create(): ApiKeyValidator {
    return new ApiKeyValidator();
  }
}
