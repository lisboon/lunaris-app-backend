import { InviteGateway } from '../../gateway/invite.gateway';
import { UserGateway } from '@/modules/user/gateway/user.gateway';
import { MemberGateway } from '@/modules/member/gateway/member.gateway';
import { User } from '@/modules/user/domain/user.entity';
import { Member } from '@/modules/member/domain/member.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { PasswordHashService } from '@/modules/@shared/domain/services/password-hash.service';
import { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';
import { Invite } from '../../domain/invite.entity';
import {
  AcceptInviteUseCaseInputDto,
  AcceptInviteUseCaseInterface,
  AcceptInviteUseCaseOutputDto,
} from './accept-invite.usecase.dto';

export default class AcceptInviteUseCase
  implements AcceptInviteUseCaseInterface
{
  constructor(
    private readonly inviteGateway: InviteGateway,
    private readonly userGateway: UserGateway,
    private readonly memberGateway: MemberGateway,
    private readonly passwordHashService: PasswordHashService,
    private readonly transactionManager: TransactionManager,
    private readonly eventDispatcher?: EventDispatcherInterface,
  ) {}

  async execute(
    data: AcceptInviteUseCaseInputDto,
  ): Promise<AcceptInviteUseCaseOutputDto> {
    const invite = await this.inviteGateway.findByToken(data.token);

    if (!invite) {
      throw new NotFoundError(data.token, Invite);
    }

    let user = await this.userGateway.findByEmail(invite.email);

    if (user) {
      const isPasswordValid = await this.passwordHashService.compare(
        data.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadLoginError();
      }
    }

    let member!: Member;

    await this.transactionManager.execute(async (trx) => {
      if (!user) {
        const hashedPassword = await this.passwordHashService.hash(
          data.password,
        );
        user = User.create({
          email: invite.email,
          name: data.name ?? invite.email,
          password: hashedPassword,
        });
        await this.userGateway.create(user, trx);
      }

      member = Member.create({
        userId: user!.id,
        organizationId: invite.organizationId,
        role: invite.role,
      });

      await this.memberGateway.create(member, trx);

      invite.accept(user!.id);
      await this.inviteGateway.update(invite, trx);
    });

    if (this.eventDispatcher) {
      for (const event of invite.pullEvents()) {
        await this.eventDispatcher.dispatch(event);
      }
    }

    return {
      userId: user!.id,
      memberId: member.id,
      organizationId: invite.organizationId,
    };
  }
}
