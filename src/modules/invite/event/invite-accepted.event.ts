import { DomainEvent } from '@/modules/@shared/domain/events/domain-event.interface';

export class InviteAcceptedEvent implements DomainEvent {
  readonly eventName = 'InviteAccepted';
  readonly occurredOn = new Date();

  constructor(
    public readonly inviteId: string,
    public readonly userId: string,
    public readonly organizationId: string,
  ) {}
}
