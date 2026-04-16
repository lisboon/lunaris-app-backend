import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { Mission } from '../mission.entity';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';

export class MissionRules {
  @IsString({ message: 'Invalid id', groups: ['create'] })
  @IsNotEmpty({ message: 'Invalid id', groups: ['create'] })
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'The id must be snake_case (e.g. qst_old_country)',
    groups: ['create'],
  })
  id: string;

  @Length(2, 100, {
    message: 'Invalid name',
    groups: ['create', 'update'],
  })
  name: string;

  @IsOptional({ groups: ['create', 'update'] })
  @IsString({
    message: 'Invalid description',
    groups: ['create', 'update'],
  })
  description?: string;

  @IsUUID('4', { message: 'Invalid organization', groups: ['create'] })
  organizationId: string;

  @IsUUID('4', { message: 'Invalid workspace', groups: ['create'] })
  workspaceId: string;

  @IsUUID('4', { message: 'Invalid author', groups: ['create'] })
  authorId: string;

  constructor(mission: Mission) {
    Object.assign(this, mission.toJSON());
  }
}

export class MissionValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: Mission,
    fields: string[],
  ): boolean {
    const rules = new MissionRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class MissionValidatorFactory {
  static create(): MissionValidator {
    return new MissionValidator();
  }
}
