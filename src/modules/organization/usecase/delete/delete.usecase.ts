import { OrganizationGateway } from '../../gateway/organization.gateway';
import { MemberGateway } from '@/modules/member/gateway/member.gateway';
import { InviteGateway } from '@/modules/invite/gateway/invite.gateway';
import { ApiKeyGateway } from '@/modules/engine/gateway/engine.gateway';
import { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  DeleteUseCaseInputDto,
  DeleteUseCaseInterface,
} from './delete.usecase.dto';

export default class DeleteUseCase implements DeleteUseCaseInterface {
  constructor(
    private readonly organizationGateway: OrganizationGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly memberGateway: MemberGateway,
    private readonly inviteGateway: InviteGateway,
    private readonly apiKeyGateway: ApiKeyGateway,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: DeleteUseCaseInputDto): Promise<void> {
    const organization = await this.findByIdUseCase.execute({ id: input.id });

    organization.delete();

    await this.transactionManager.execute(async (trx) => {
      await this.organizationGateway.update(organization, trx);
      await this.memberGateway.softDeleteByOrganization(input.id, trx);
      await this.inviteGateway.cancelPendingByOrganization(input.id, trx);
      await this.apiKeyGateway.revokeByOrganization(input.id, trx);
    });
  }
}
