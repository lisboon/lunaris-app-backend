import { InviteGateway } from '../../gateway/invite.gateway';
import { Invite } from '../../domain/invite.entity';
import { InviteTokenService } from '@/modules/@shared/domain/services/invite-token.service';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';
import {
  CreateInviteUseCaseInputDto,
  CreateInviteUseCaseInterface,
  CreateInviteUseCaseOutputDto,
} from './create-invite.usecase.dto';

const INVITE_EXPIRY_DAYS = 7;

export default class CreateInviteUseCase
  implements CreateInviteUseCaseInterface
{
  constructor(
    private readonly inviteGateway: InviteGateway,
    private readonly inviteTokenService: InviteTokenService,
    private readonly eventDispatcher?: EventDispatcherInterface,
  ) {}

  async execute(
    data: CreateInviteUseCaseInputDto,
  ): Promise<CreateInviteUseCaseOutputDto> {
    const existing = await this.inviteGateway.findByEmailAndOrg(
      data.email,
      data.organizationId,
    );

    if (existing) {
      throw new EntityValidationError([
        {
          field: 'email',
          message: 'A pending invite already exists for this email',
        },
      ]);
    }

    const token = this.inviteTokenService.generate();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = Invite.create({
      email: data.email,
      role: data.role,
      organizationId: data.organizationId,
      invitedById: data.invitedById,
      token,
      expiresAt,
    });

    await this.inviteGateway.create(invite);

    if (this.eventDispatcher) {
      for (const event of invite.pullEvents()) {
        await this.eventDispatcher.dispatch(event);
      }
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      organizationId: invite.organizationId,
      token: invite.token,
      expiresAt: invite.expiresAt,
    };
  }
}
