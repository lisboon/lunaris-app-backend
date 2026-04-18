import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole, InviteStatus } from '@/modules/@shared/domain/enums';
import InviteValidatorFactory from './validators/invite.validator';
import { InviteCreatedEvent } from '../event/invite-created.event';
import { InviteAcceptedEvent } from '../event/invite-accepted.event';

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
    return new Date() > this._expiresAt;
  }

  accept(userId: string): void {
    if (this._status !== InviteStatus.PENDING) {
      throw new ForbiddenError('Invite is not pending');
    }
    if (this.isExpired()) {
      throw new ForbiddenError('Invite has expired');
    }
    this._status = InviteStatus.ACCEPTED;
    this.update();
    this.addEvent(
      new InviteAcceptedEvent(this._id, userId, this._organizationId),
    );
  }

  cancel(): void {
    if (this._status !== InviteStatus.PENDING) {
      throw new ForbiddenError('Invite is not pending');
    }
    this._status = InviteStatus.CANCELLED;
    this.update();
  }

  renewToken(newToken: string, newExpiresAt: Date): void {
    if (this._status !== InviteStatus.PENDING) {
      throw new ForbiddenError('Invite is not pending');
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

    invite.addEvent(
      new InviteCreatedEvent(invite._id, invite._email, invite._organizationId),
    );

    return invite;
  }

  toJSON() {
    return {
      id: this._id,
      email: this._email,
      role: this._role,
      status: this._status,
      organizationId: this._organizationId,
      invitedById: this._invitedById,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
