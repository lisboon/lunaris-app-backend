import { DomainEvent } from '@/modules/@shared/domain/events/domain-event.interface';

export class MissionCreatedEvent implements DomainEvent {
  readonly eventName = 'MissionCreated';
  readonly occurredOn = new Date();

  constructor(
    public readonly missionId: string,
    public readonly name: string,
    public readonly organizationId: string,
    public readonly authorId: string,
  ) {}
}
