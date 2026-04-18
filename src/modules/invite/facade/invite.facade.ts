import { CreateInviteUseCaseInterface } from '../usecase/create-invite/create-invite.usecase.dto';
import { AcceptInviteUseCaseInterface } from '../usecase/accept-invite/accept-invite.usecase.dto';
import { CancelInviteUseCaseInterface } from '../usecase/cancel-invite/cancel-invite.usecase.dto';
import { ListInvitesUseCaseInterface } from '../usecase/list-invites/list-invites.usecase.dto';
import { ResendInviteUseCaseInterface } from '../usecase/resend-invite/resend-invite.usecase.dto';
import {
  InviteFacadeInterface,
  CreateInviteFacadeInputDto,
  CreateInviteFacadeOutputDto,
  AcceptInviteFacadeInputDto,
  AcceptInviteFacadeOutputDto,
  CancelInviteFacadeInputDto,
  ListInvitesFacadeInputDto,
  ListInvitesFacadeOutputDto,
  ResendInviteFacadeInputDto,
} from './invite.facade.dto';

export default class InviteFacade implements InviteFacadeInterface {
  constructor(
    private readonly createUseCase: CreateInviteUseCaseInterface,
    private readonly acceptUseCase: AcceptInviteUseCaseInterface,
    private readonly cancelUseCase: CancelInviteUseCaseInterface,
    private readonly listUseCase: ListInvitesUseCaseInterface,
    private readonly resendUseCase: ResendInviteUseCaseInterface,
  ) {}

  async create(data: CreateInviteFacadeInputDto): Promise<CreateInviteFacadeOutputDto> {
    return this.createUseCase.execute(data);
  }

  async accept(data: AcceptInviteFacadeInputDto): Promise<AcceptInviteFacadeOutputDto> {
    return this.acceptUseCase.execute(data);
  }

  async cancel(data: CancelInviteFacadeInputDto): Promise<void> {
    return this.cancelUseCase.execute(data);
  }

  async list(data: ListInvitesFacadeInputDto): Promise<ListInvitesFacadeOutputDto> {
    return this.listUseCase.execute(data);
  }

  async resend(data: ResendInviteFacadeInputDto): Promise<void> {
    return this.resendUseCase.execute(data);
  }
}
