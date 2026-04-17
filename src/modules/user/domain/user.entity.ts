import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import UserValidatorFactory from './validators/user.validator';

export interface UserProps {
  id?: string;
  email: string;
  name: string;
  password: string;
  avatarUrl?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User extends BaseEntity {
  private _email: string;
  private _name: string;
  private _password: string;
  private _avatarUrl?: string;

  constructor(props: UserProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._email = props.email;
    this._name = props.name;
    this._password = props.password;
    this._avatarUrl = props.avatarUrl;
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get password(): string {
    return this._password;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  changeName(name: string): void {
    this._name = name;
  }

  changeEmail(email: string): void {
    this._email = email;
  }

  changePassword(hashedPassword: string): void {
    this._password = hashedPassword;
    this.update();
  }

  updateUser(
    props: Partial<Pick<UserProps, 'name' | 'email' | 'avatarUrl'>>,
  ): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.email !== undefined) this._email = props.email;
    if (props.avatarUrl !== undefined) this._avatarUrl = props.avatarUrl;

    this.update();
    this.validate(['update']);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  validate(fields?: string[]): void {
    const validator = UserValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(props: UserProps): User {
    const user = new User(props);
    user.validate();

    if (user.notification.hasErrors()) {
      throw new EntityValidationError(user.notification.toJSON());
    }

    return user;
  }

  toJSON() {
    return {
      id: this._id,
      email: this._email,
      name: this._name,
      avatarUrl: this._avatarUrl,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}