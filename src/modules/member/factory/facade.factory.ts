import prisma from '@/infra/database/prisma.instance';
import MemberRepository from '../repository/member.repository';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import ListByOrganizationUseCase from '../usecase/list-by-organization/list-by-organization.usecase';
import ChangeRoleUseCase from '../usecase/change-role/change-role.usecase';
import RemoveMemberUseCase from '../usecase/remove-member/remove-member.usecase';
import MemberFacade from '../facade/member.facade';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';

export default class MemberFacadeFactory {
  static create() {
    const memberRepository = new MemberRepository(prisma);
    const transactionManager = new PrismaTransactionManager(prisma);

    const findByIdUseCase = new FindByIdUseCase(memberRepository);
    const listByOrganizationUseCase = new ListByOrganizationUseCase(
      memberRepository,
    );
    const changeRoleUseCase = new ChangeRoleUseCase(
      memberRepository,
      findByIdUseCase,
      transactionManager,
    );
    const removeUseCase = new RemoveMemberUseCase(
      memberRepository,
      findByIdUseCase,
      transactionManager,
    );

    return new MemberFacade(
      findByIdUseCase,
      listByOrganizationUseCase,
      changeRoleUseCase,
      removeUseCase,
    );
  }
}
