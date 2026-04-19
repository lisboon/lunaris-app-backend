import prisma from '@/infra/database/prisma.instance';
import OrganizationRepository from '../repository/organization.repository';
import MemberRepository from '@/modules/member/repository/member.repository';
import InviteRepository from '@/modules/invite/repository/invite.repository';
import ApiKeyRepository from '@/modules/engine/repository/engine.repository';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import UpdateUseCase from '../usecase/update/update.usecase';
import DeleteUseCase from '../usecase/delete/delete.usecase';
import OrganizationFacade from '../facade/organization.facade';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';

export default class OrganizationFacadeFactory {
  static create() {
    const organizationRepository = new OrganizationRepository(prisma);
    const memberRepository = new MemberRepository(prisma);
    const inviteRepository = new InviteRepository(prisma);
    const apiKeyRepository = new ApiKeyRepository(prisma);
    const transactionManager = new PrismaTransactionManager(prisma);

    const findByIdUseCase = new FindByIdUseCase(organizationRepository);
    const updateUseCase = new UpdateUseCase(organizationRepository, findByIdUseCase);
    const deleteUseCase = new DeleteUseCase(
      organizationRepository,
      findByIdUseCase,
      memberRepository,
      inviteRepository,
      apiKeyRepository,
      transactionManager,
    );

    return new OrganizationFacade(findByIdUseCase, updateUseCase, deleteUseCase);
  }
}
