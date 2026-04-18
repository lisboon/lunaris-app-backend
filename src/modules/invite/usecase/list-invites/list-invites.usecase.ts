import { InviteGateway } from '../../gateway/invite.gateway';
import {
  ListInvitesUseCaseInputDto,
  ListInvitesUseCaseInterface,
} from './list-invites.usecase.dto';

export default class ListInvitesUseCase implements ListInvitesUseCaseInterface {
  constructor(private readonly inviteGateway: InviteGateway) {}

  async execute(data: ListInvitesUseCaseInputDto): Promise<object[]> {
    const invites = await this.inviteGateway.findByOrganization(
      data.organizationId,
    );

    return invites.map((invite) => invite.toJSON());
  }
}
