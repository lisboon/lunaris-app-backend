import prisma from '@/infra/database/prisma.instance';
import MemberRepository from '../repository/member.repository';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import ListByOrganizationUseCase from '../usecase/list-by-organization/list-by-organization.usecase';
import ChangeRoleUseCase from '../usecase/change-role/change-role.usecase';
import RemoveMemberUseCase from '../usecase/remove/remove.usecase';
import MemberFacade from '../facade/member.facade';

export default class MemberFacadeFactory {
  static create() {
    const memberRepository = new MemberRepository(prisma);

    const findByIdUseCase = new FindByIdUseCase(memberRepository);
    const listByOrganizationUseCase = new ListByOrganizationUseCase(memberRepository);
    const changeRoleUseCase = new ChangeRoleUseCase(memberRepository, findByIdUseCase);
    const removeUseCase = new RemoveMemberUseCase(memberRepository, findByIdUseCase);

    return new MemberFacade(
      findByIdUseCase,
      listByOrganizationUseCase,
      changeRoleUseCase,
      removeUseCase,
    );
  }
}
