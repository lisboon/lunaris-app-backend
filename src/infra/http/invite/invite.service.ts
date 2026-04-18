import { Inject, Injectable } from '@nestjs/common';
import InviteFacade from '@/modules/invite/facade/invite.facade';
import {
  CreateInviteFacadeInputDto,
  AcceptInviteFacadeInputDto,
  CancelInviteFacadeInputDto,
  ListInvitesFacadeInputDto,
  ResendInviteFacadeInputDto,
} from '@/modules/invite/facade/invite.facade.dto';

@Injectable()
export class InviteService {
  @Inject(InviteFacade)
  private readonly inviteFacade: InviteFacade;

  async create(input: CreateInviteFacadeInputDto) {
    return this.inviteFacade.create(input);
  }

  async accept(input: AcceptInviteFacadeInputDto) {
    return this.inviteFacade.accept(input);
  }

  async cancel(input: CancelInviteFacadeInputDto) {
    return this.inviteFacade.cancel(input);
  }

  async list(input: ListInvitesFacadeInputDto) {
    return this.inviteFacade.list(input);
  }

  async resend(input: ResendInviteFacadeInputDto) {
    return this.inviteFacade.resend(input);
  }
}
