import { MissionStatus } from '@/modules/@shared/domain/enums';
import MissionValidatorFactory from './validators/mission.validator';
import BaseEntity from '@/modules/@shared/domain/entity/base.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MissionCreatedEvent } from '../event/mission-created.event';
import { MissionPublishedEvent } from '../event/mission-published.event';

export interface MissionProps {
  id: string;
  name: string;
  description?: string;
  status?: MissionStatus;
  activeHash?: string;
  organizationId: string;
  workspaceId: string;
  authorId: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Mission extends BaseEntity {
  private _name: string;
  private _description?: string;
  private _status: MissionStatus;
  private _activeHash?: string;
  private _organizationId: string;
  private _workspaceId: string;
  private _authorId: string;

  constructor(props: MissionProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._name = props.name;
    this._description = props.description;
    this._status = props.status ?? MissionStatus.DRAFT;
    this._activeHash = props.activeHash;
    this._organizationId = props.organizationId;
    this._workspaceId = props.workspaceId;
    this._authorId = props.authorId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get status(): MissionStatus {
    return this._status;
  }

  get activeHash(): string | undefined {
    return this._activeHash;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get workspaceId(): string {
    return this._workspaceId;
  }

  get authorId(): string {
    return this._authorId;
  }

  changeName(name: string): void {
    this._name = name;
    this.update();
  }

  changeDescription(description: string): void {
    this._description = description;
    this.update();
  }

  changeStatus(status: MissionStatus): void {
    this._status = status;
    this.update();
  }

  updateMission(props: Partial<Pick<MissionProps, 'name' | 'description'>>): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.description !== undefined) this._description = props.description;

    this.update();
    this.validate(['update']);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  publish(hash: string): void {
    this._activeHash = hash;
    this._status = MissionStatus.APPROVED;
    this.update();

    this.addEvent(
      new MissionPublishedEvent(this._id, hash, this._organizationId),
    );
  }

  validate(fields?: string[]): void {
    const validator = MissionValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ['create']);
  }

  static create(props: MissionProps): Mission {
    const mission = new Mission(props);
    mission.validate();

    if (mission.notification.hasErrors()) {
      throw new EntityValidationError(mission.notification.toJSON());
    }

    mission.addEvent(
      new MissionCreatedEvent(
        mission._id,
        mission._name,
        mission._organizationId,
        mission._authorId,
      ),
    );

    return mission;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description ?? null,
      status: this._status,
      activeHash: this._activeHash ?? null,
      organizationId: this._organizationId,
      workspaceId: this._workspaceId,
      authorId: this._authorId,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
