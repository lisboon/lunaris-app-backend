import { DomainEvent } from '@/modules/@shared/domain/events/domain-event.interface';

export class InviteCreatedEvent implements DomainEvent {
  readonly eventName = 'InviteCreated';
  readonly occurredOn = new Date();

  constructor(
    public readonly inviteId: string,
    public readonly email: string,
    public readonly organizationId: string,
  ) {}
}
