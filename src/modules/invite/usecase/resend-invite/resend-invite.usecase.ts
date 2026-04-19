import { InviteGateway } from '../../gateway/invite.gateway';
import { InviteTokenService } from '@/modules/@shared/domain/services/invite-token.service';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';
import { Invite } from '../../domain/invite.entity';
import {
  ResendInviteUseCaseInputDto,
  ResendInviteUseCaseInterface,
} from './resend-invite.usecase.dto';

const INVITE_EXPIRY_DAYS = 7;

export default class ResendInviteUseCase implements ResendInviteUseCaseInterface {
  constructor(
    private readonly inviteGateway: InviteGateway,
    private readonly inviteTokenService: InviteTokenService,
    private readonly eventDispatcher?: EventDispatcherInterface,
  ) {}

  async execute(input: ResendInviteUseCaseInputDto): Promise<void> {
    const invite = await this.inviteGateway.findById(
      input.id,
      input.organizationId,
    );

    if (!invite) {
      throw new NotFoundError(input.id, Invite);
    }

    const newToken = this.inviteTokenService.generate();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + INVITE_EXPIRY_DAYS);

    invite.renewToken(newToken, newExpiresAt);

    await this.inviteGateway.update(invite);

    if (this.eventDispatcher) {
      for (const event of invite.pullEvents()) {
        await this.eventDispatcher.dispatch(event);
      }
    }
  }
}
