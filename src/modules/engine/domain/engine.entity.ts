import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import ApiKeyValidatorFactory from './validators/engine.validator';

export interface ApiKeyProps {
  id?: string;
  organizationId: string;
  name: string;
  keyHash: string;
  prefix: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class ApiKey extends BaseEntity {
  private _organizationId: string;
  private _name: string;
  private _keyHash: string;
  private _prefix: string;
  private _lastUsedAt: Date | null;
  private _expiresAt: Date | null;
  private _revokedAt: Date | null;

  constructor(props: ApiKeyProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active ?? props.revokedAt == null,
      props.deletedAt,
    );
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._keyHash = props.keyHash;
    this._prefix = props.prefix;
    this._lastUsedAt = props.lastUsedAt ?? null;
    this._expiresAt = props.expiresAt ?? null;
    this._revokedAt = props.revokedAt ?? null;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get name(): string {
    return this._name;
  }

  get keyHash(): string {
    return this._keyHash;
  }

  get prefix(): string {
    return this._prefix;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  get expiresAt(): Date | null {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  revoke(): void {
    this._revokedAt = new Date();
    this.deactivate();
  }

  touchLastUsed(at: Date = new Date()): void {
    this._lastUsedAt = at;
    this.update();
  }

  isExpired(): boolean {
    return this._expiresAt !== null && this._expiresAt < new Date();
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  validate(fields?: string[]): void {
    const validator = ApiKeyValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(
    props: Omit<
      ApiKeyProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'active'
    >,
  ): ApiKey {
    const apiKey = new ApiKey(props);
    apiKey.validate();

    if (apiKey.notification.hasErrors()) {
      throw new EntityValidationError(apiKey.notification.toJSON());
    }

    return apiKey;
  }

  toJSON() {
    return {
      id: this._id,
      organizationId: this._organizationId,
      name: this._name,
      keyHash: this._keyHash,
      prefix: this._prefix,
      lastUsedAt: this._lastUsedAt,
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
