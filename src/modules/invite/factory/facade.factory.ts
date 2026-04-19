import prisma from '@/infra/database/prisma.instance';
import InviteRepository from '../repository/invite.repository';
import UserRepository from '@/modules/user/repository/user.repository';
import MemberRepository from '@/modules/member/repository/member.repository';
import CreateInviteUseCase from '../usecase/create-invite/create-invite.usecase';
import AcceptInviteUseCase from '../usecase/accept-invite/accept-invite.usecase';
import CancelInviteUseCase from '../usecase/cancel-invite/cancel-invite.usecase';
import ListInvitesUseCase from '../usecase/list-invites/list-invites.usecase';
import ResendInviteUseCase from '../usecase/resend-invite/resend-invite.usecase';
import InviteFacade from '../facade/invite.facade';
import { BcryptPasswordHashService } from '@/infra/services/bcrypt-password-hash.service';
import { CryptoInviteTokenService } from '@/infra/services/crypto-invite-token.service';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';

export default class InviteFacadeFactory {
  static create(eventDispatcher?: EventDispatcherInterface): InviteFacade {
    const inviteRepository = new InviteRepository(prisma);
    const userRepository = new UserRepository(prisma);
    const memberRepository = new MemberRepository(prisma);
    const passwordHashService = new BcryptPasswordHashService();
    const inviteTokenService = new CryptoInviteTokenService();
    const transactionManager = new PrismaTransactionManager(prisma);

    const createUseCase = new CreateInviteUseCase(
      inviteRepository,
      inviteTokenService,
      eventDispatcher,
    );
    const acceptUseCase = new AcceptInviteUseCase(
      inviteRepository,
      userRepository,
      memberRepository,
      passwordHashService,
      transactionManager,
      eventDispatcher,
    );
    const cancelUseCase = new CancelInviteUseCase(inviteRepository);
    const listUseCase = new ListInvitesUseCase(inviteRepository);
    const resendUseCase = new ResendInviteUseCase(
      inviteRepository,
      inviteTokenService,
      eventDispatcher,
    );

    return new InviteFacade(
      createUseCase,
      acceptUseCase,
      cancelUseCase,
      listUseCase,
      resendUseCase,
    );
  }
}
