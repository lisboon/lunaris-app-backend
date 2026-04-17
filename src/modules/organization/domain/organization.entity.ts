import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import OrganizationValidatorFactory from './validators/organization.validator';

export interface OrganizationProps {
  id?: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Organization extends BaseEntity {
  private _name: string;
  private _slug: string;
  private _avatarUrl?: string;

  constructor(props: OrganizationProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._name = props.name;
    this._slug = props.slug;
    this._avatarUrl = props.avatarUrl;
  }

  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  changeName(name: string): void {
    this._name = name;
  }

  changeSlug(slug: string): void {
    this._slug = slug;
  }

  updateOrganization(
    props: Partial<Pick<OrganizationProps, 'name' | 'slug' | 'avatarUrl'>>,
  ): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.slug !== undefined) this._slug = props.slug;
    if (props.avatarUrl !== undefined) this._avatarUrl = props.avatarUrl;

    this.update();
    this.validate(['update']);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  validate(fields?: string[]): void {
    const validator = OrganizationValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(props: OrganizationProps): Organization {
    const org = new Organization(props);
    org.validate();

    if (org.notification.hasErrors()) {
      throw new EntityValidationError(org.notification.toJSON());
    }

    return org;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      slug: this._slug,
      avatarUrl: this._avatarUrl,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}