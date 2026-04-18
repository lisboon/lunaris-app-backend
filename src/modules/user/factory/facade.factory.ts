import prisma from '@/infra/database/prisma.instance';
import UserRepository from '../repository/user.repository';
import OrganizationRepository from '@/modules/organization/repository/organization.repository';
import MemberRepository from '@/modules/member/repository/member.repository';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import RegisterUseCase from '../usecase/register/register.usecase';
import LoginUseCase from '../usecase/login/login.usecase';
import UserFacade from '../facade/user.facade';
import { BcryptPasswordHashService } from '@/infra/services/bcrypt-password-hash.service';
import { JwtTokenServiceImpl } from '@/infra/services/jwt-token.service';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';

export default class UserFacadeFactory {
  static create() {
    const userRepository = new UserRepository(prisma);
    const organizationRepository = new OrganizationRepository(prisma);
    const memberRepository = new MemberRepository(prisma);
    const passwordHashService = new BcryptPasswordHashService();
    const jwtTokenService = new JwtTokenServiceImpl();
    const transactionManager = new PrismaTransactionManager(prisma);

    const findByIdUseCase = new FindByIdUseCase(userRepository);
    const registerUseCase = new RegisterUseCase(
      transactionManager,
      userRepository,
      organizationRepository,
      memberRepository,
      passwordHashService,
    );
    const loginUseCase = new LoginUseCase(
      userRepository,
      memberRepository,
      organizationRepository,
      passwordHashService,
      jwtTokenService,
    );

    return new UserFacade(findByIdUseCase, registerUseCase, loginUseCase);
  }
}
