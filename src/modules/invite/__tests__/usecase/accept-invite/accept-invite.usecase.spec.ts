import AcceptInviteUseCase from '../../../usecase/accept-invite/accept-invite.usecase';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { Invite } from '../../../domain/invite.entity';
import { User } from '@/modules/user/domain/user.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { InviteAcceptedEvent } from '../../../event/invite-accepted.event';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const INVITED_BY_ID = '22222222-2222-4222-8222-222222222222';

const validInvite = () =>
  Invite.create({
    email: 'newbie@studio.io',
    role: MemberRole.DESIGNER,
    organizationId: ORG_ID,
    invitedById: INVITED_BY_ID,
    token: 'valid-token-xyz',
    expiresAt: new Date(Date.now() + 86400000 * 7),
  });

const existingUser = () =>
  User.create({
    email: 'newbie@studio.io',
    name: 'Newbie',
    password: 'hashed_pw',
  });

const makeSut = ({
  invite = null as Invite | null,
  user = null as User | null,
} = {}) => {
  const inviteGateway = {
    findByToken: jest.fn().mockResolvedValue(invite),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const userGateway = {
    findByEmail: jest.fn().mockResolvedValue(user),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const memberGateway = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  const passwordHashService = {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true),
  };
  const transactionManager = {
    execute: jest.fn().mockImplementation(async (fn: any) => fn({ trx: true })),
  };
  const eventDispatcher = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    register: jest.fn(),
    has: jest.fn(),
    clear: jest.fn(),
  };

  const useCase = new AcceptInviteUseCase(
    inviteGateway as any,
    userGateway as any,
    memberGateway as any,
    passwordHashService as any,
    transactionManager as any,
    eventDispatcher as any,
  );

  return {
    useCase,
    inviteGateway,
    userGateway,
    memberGateway,
    passwordHashService,
    transactionManager,
    eventDispatcher,
  };
};

describe('AcceptInviteUseCase', () => {
  it('creates a new user and member when user does not exist', async () => {
    const invite = validInvite();
    const { useCase, userGateway, memberGateway, passwordHashService } =
      makeSut({ invite, user: null });

    const result = await useCase.execute({
      token: 'valid-token-xyz',
      name: 'New Artist',
      password: 'Password123',
    });

    expect(passwordHashService.hash).toHaveBeenCalledWith('Password123');
    expect(userGateway.create).toHaveBeenCalledTimes(1);
    expect(memberGateway.create).toHaveBeenCalledTimes(1);
    expect(result.organizationId).toBe(ORG_ID);
    expect(result.userId).toBeDefined();
    expect(result.memberId).toBeDefined();
  });

  it('uses existing user and only creates member when user already exists', async () => {
    const invite = validInvite();
    const user = existingUser();
    const { useCase, userGateway, memberGateway, passwordHashService } =
      makeSut({ invite, user });

    const result = await useCase.execute({
      token: 'valid-token-xyz',
      password: 'Password123',
    });

    expect(passwordHashService.compare).toHaveBeenCalledWith(
      'Password123',
      user.password,
    );
    expect(passwordHashService.hash).not.toHaveBeenCalled();
    expect(userGateway.create).not.toHaveBeenCalled();
    expect(memberGateway.create).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe(user.id);
  });

  it('throws BadLoginError when existing user password does not match', async () => {
    const invite = validInvite();
    const user = existingUser();
    const { useCase, memberGateway, passwordHashService } = makeSut({
      invite,
      user,
    });
    passwordHashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ token: 'valid-token-xyz', password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(BadLoginError);

    expect(memberGateway.create).not.toHaveBeenCalled();
  });

  it('calls inviteGateway.update with the transaction context', async () => {
    const invite = validInvite();
    const { useCase, inviteGateway } = makeSut({ invite });

    await useCase.execute({
      token: 'valid-token-xyz',
      password: 'Password123',
    });

    expect(inviteGateway.update).toHaveBeenCalledWith(
      invite,
      expect.objectContaining({ trx: true }),
    );
  });

  it('dispatches InviteAcceptedEvent after the transaction commits', async () => {
    const invite = validInvite();
    const { useCase, eventDispatcher } = makeSut({ invite });

    await useCase.execute({
      token: 'valid-token-xyz',
      password: 'Password123',
    });

    const dispatched = eventDispatcher.dispatch.mock.calls.map(
      (call: any[]) => call[0],
    );
    expect(
      dispatched.some((e: any) => e instanceof InviteAcceptedEvent),
    ).toBe(true);
  });

  it('throws NotFoundError when invite token is not found', async () => {
    const { useCase } = makeSut({ invite: null });

    await expect(
      useCase.execute({ token: 'nonexistent-token', password: 'Password123' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ForbiddenError when invite is expired', async () => {
    const expiredInvite = Invite.create({
      email: 'newbie@studio.io',
      role: MemberRole.DESIGNER,
      organizationId: ORG_ID,
      invitedById: INVITED_BY_ID,
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 1000),
    });

    const { useCase } = makeSut({ invite: expiredInvite });

    await expect(
      useCase.execute({ token: 'expired-token', password: 'Password123' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
