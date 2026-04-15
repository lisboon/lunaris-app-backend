import { DomainEvent } from '@/modules/@shared/domain/events/domain-event.interface';

export class MissionPublishedEvent implements DomainEvent {
  readonly eventName = 'MissionPublished';
  readonly occurredOn = new Date();

  constructor(
    public readonly missionId: string,
    public readonly activeHash: string,
    public readonly organizationId: string,
  ) {}
}
