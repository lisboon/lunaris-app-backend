import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole, InviteStatus } from '@/modules/@shared/domain/enums';
import InviteValidatorFactory from './validators/invite.validator';

export interface InviteProps {
  id?: string;
  email: string;
  role: MemberRole;
  status?: InviteStatus;
  token: string;
  organizationId: string;
  invitedById: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Invite extends BaseEntity {
  private _email: string;
  private _role: MemberRole;
  private _status: InviteStatus;
  private _token: string;
  private _organizationId: string;
  private _invitedById: string;
  private _expiresAt: Date;

  constructor(props: InviteProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._email = props.email;
    this._role = props.role;
    this._status = props.status ?? InviteStatus.PENDING;
    this._token = props.token;
    this._organizationId = props.organizationId;
    this._invitedById = props.invitedById;
    this._expiresAt = props.expiresAt;
  }

  get email(): string {
    return this._email;
  }

  get role(): MemberRole {
    return this._role;
  }

  get status(): InviteStatus {
    return this._status;
  }

  get token(): string {
    return this._token;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get invitedById(): string {
    return this._invitedById;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  accept(): void {
    if (this._status !== InviteStatus.PENDING) {
      throw new ForbiddenError('Invite can only be accepted when PENDING');
    }
    if (this.isExpired()) {
      throw new ForbiddenError('Invite has expired');
    }
    this._status = InviteStatus.ACCEPTED;
    this.update();
  }

  cancel(): void {
    if (this._status !== InviteStatus.PENDING) {
      throw new ForbiddenError('Invite can only be cancelled when PENDING');
    }
    this._status = InviteStatus.CANCELLED;
    this.update();
  }

  renewToken(newToken: string, newExpiresAt: Date): void {
    if (this._status !== InviteStatus.PENDING) {
      throw new ForbiddenError('Only PENDING invites can be resent');
    }
    this._token = newToken;
    this._expiresAt = newExpiresAt;
    this.update();
  }

  validate(fields?: string[]): void {
    const validator = InviteValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(props: InviteProps): Invite {
    const invite = new Invite(props);
    invite.validate();

    if (invite.notification.hasErrors()) {
      throw new EntityValidationError(invite.notification.toJSON());
    }

    return invite;
  }

  toJSON() {
    return {
      id: this._id,
      email: this._email,
      role: this._role,
      status: this._status,
      token: this._token,
      organizationId: this._organizationId,
      invitedById: this._invitedById,
      expiresAt: this._expiresAt,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}