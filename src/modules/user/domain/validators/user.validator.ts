import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import { User } from '../user.entity';

export class UserRules {
  @IsEmail({}, {
    message: 'Invalid email',
    groups: ['create', 'email', 'update'],
  })
  email: string;

  @Length(2, 255, {
    message: 'Invalid name',
    groups: ['create', 'name', 'update'],
  })
  name: string;

  @IsNotEmpty({
    message: 'Password is required',
    groups: ['create', 'password'],
  })
  password: string;

  constructor(data: User) {
    const json = data.toJSON();
    Object.assign(this, json);
    // password is omitted from toJSON for security, assign directly
    this.password = data.password;
  }
}

export class UserValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: User,
    fields: string[],
  ): boolean {
    const rules = new UserRules(data);
    const newFields = fields?.length ? fields : ['create'];
    return super.validate(notification, rules, newFields);
  }
}

export default class UserValidatorFactory {
  static create(): UserValidator {
    return new UserValidator();
  }
}