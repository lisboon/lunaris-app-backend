import ResendInviteUseCase from '../../../usecase/resend-invite/resend-invite.usecase';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Invite } from '../../../domain/invite.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { InviteResentEvent } from '../../../event/invite-resent.event';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const INVITED_BY_ID = '22222222-2222-4222-8222-222222222222';

const pendingInvite = () =>
  Invite.create({
    email: 'artist@studio.io',
    role: MemberRole.DESIGNER,
    organizationId: ORG_ID,
    invitedById: INVITED_BY_ID,
    token: 'old-token',
    expiresAt: new Date(Date.now() + 86400000),
  });

const makeSut = (invite: Invite | null = null) => {
  const inviteGateway = {
    findById: jest.fn().mockResolvedValue(invite),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const inviteTokenService = {
    generate: jest.fn().mockReturnValue('new-token-xyz'),
  };
  const eventDispatcher = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    register: jest.fn(),
    has: jest.fn(),
    clear: jest.fn(),
  };
  const useCase = new ResendInviteUseCase(
    inviteGateway as any,
    inviteTokenService as any,
    eventDispatcher as any,
  );
  return { useCase, inviteGateway, inviteTokenService, eventDispatcher };
};

describe('ResendInviteUseCase', () => {
  it('renews the invite token and extends expiry', async () => {
    const invite = pendingInvite();
    const { useCase, inviteGateway, inviteTokenService } = makeSut(invite);

    await useCase.execute({ id: invite.id, organizationId: ORG_ID });

    expect(inviteTokenService.generate).toHaveBeenCalledTimes(1);
    expect(inviteGateway.update).toHaveBeenCalledTimes(1);
    expect(invite.token).toBe('new-token-xyz');
  });

  it('dispatches InviteResentEvent after the update persists', async () => {
    const invite = pendingInvite();
    const { useCase, eventDispatcher, inviteGateway } = makeSut(invite);

    await useCase.execute({ id: invite.id, organizationId: ORG_ID });

    const updateCallOrder = inviteGateway.update.mock.invocationCallOrder[0];
    const dispatchCallOrder =
      eventDispatcher.dispatch.mock.invocationCallOrder[0];
    expect(dispatchCallOrder).toBeGreaterThan(updateCallOrder);

    const dispatched = eventDispatcher.dispatch.mock.calls.map(
      (call: any[]) => call[0],
    );
    expect(
      dispatched.some((e: any) => e instanceof InviteResentEvent),
    ).toBe(true);
  });

  it('throws NotFoundError when invite not found', async () => {
    const { useCase } = makeSut(null);

    await expect(
      useCase.execute({
        id: '00000000-0000-4000-8000-000000000000',
        organizationId: ORG_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
