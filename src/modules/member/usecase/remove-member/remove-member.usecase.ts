import { MemberGateway } from '../../gateway/member.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import {
  RemoveMemberUseCaseInputDto,
  RemoveMemberUseCaseInterface,
} from './remove-member.usecase.dto';

export default class RemoveMemberUseCase
  implements RemoveMemberUseCaseInterface
{
  constructor(
    private readonly memberGateway: MemberGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: RemoveMemberUseCaseInputDto): Promise<void> {
    const member = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    const removingAdmin = member.role === MemberRole.ADMIN;

    await this.transactionManager.execute(
      async (trx) => {
        if (removingAdmin) {
          const adminCount = await this.memberGateway.countAdmins(
            input.organizationId,
            trx,
          );
          if (adminCount <= 1) {
            throw new ForbiddenError('Cannot remove the last admin');
          }
        }

        member.delete();
        await this.memberGateway.update(member, trx);
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
