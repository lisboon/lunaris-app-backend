import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MemberRole } from '@/modules/@shared/domain/enums';
import MemberValidatorFactory from './validators/member.validator';

export interface MemberProps {
  id?: string;
  userId: string;
  organizationId: string;
  role?: MemberRole;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Member extends BaseEntity {
  private _userId: string;
  private _organizationId: string;
  private _role: MemberRole;

  constructor(props: MemberProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._userId = props.userId;
    this._organizationId = props.organizationId;
    this._role = props.role ?? MemberRole.DESIGNER;
  }

  get userId(): string {
    return this._userId;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get role(): MemberRole {
    return this._role;
  }

  changeRole(role: MemberRole) {
    this._role = role;
    this.update();
  }

  validate(fields?: string[]): void {
    const validator = MemberValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(props: MemberProps): Member {
    const member = new Member(props);
    member.validate();

    if (member.notification.hasErrors()) {
      throw new EntityValidationError(member.notification.toJSON());
    }

    return member;
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      organizationId: this._organizationId,
      role: this._role,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
