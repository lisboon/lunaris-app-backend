import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import WorkspaceValidatorFactory from './validators/workspace.validator';

export interface WorkspaceProps {
  id?: string;
  name: string;
  organizationId: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Workspace extends BaseEntity {
  private _name: string;
  private _organizationId: string;

  constructor(props: WorkspaceProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._name = props.name;
    this._organizationId = props.organizationId;
  }

  get name(): string {
    return this._name;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  changeName(name: string) {
    this._name = name;
  }

  updateWorkspace(props: Partial<WorkspaceProps>) {
    if (props.name !== undefined) this.changeName(props.name);

    this.update();
    this.validate(['update']);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  validate(fields?: string[]): void {
    const validator = WorkspaceValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(props: WorkspaceProps): Workspace {
    const workspace = new Workspace(props);
    workspace.validate();

    if (workspace.notification.hasErrors()) {
      throw new EntityValidationError(workspace.notification.toJSON());
    }

    return workspace;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      organizationId: this._organizationId,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
