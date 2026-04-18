import { InviteGateway } from '../../gateway/invite.gateway';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Invite } from '../../domain/invite.entity';
import {
  CancelInviteUseCaseInputDto,
  CancelInviteUseCaseInterface,
} from './cancel-invite.usecase.dto';

export default class CancelInviteUseCase
  implements CancelInviteUseCaseInterface
{
  constructor(private readonly inviteGateway: InviteGateway) {}

  async execute(input: CancelInviteUseCaseInputDto): Promise<void> {
    const invite = await this.inviteGateway.findById(
      input.id,
      input.organizationId,
    );

    if (!invite) {
      throw new NotFoundError(input.id, Invite);
    }

    invite.cancel();

    await this.inviteGateway.update(invite);
  }
}
