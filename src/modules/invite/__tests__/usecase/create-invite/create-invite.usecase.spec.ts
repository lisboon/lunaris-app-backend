import CreateInviteUseCase from '../../../usecase/create-invite/create-invite.usecase';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { Invite } from '../../../domain/invite.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const INVITED_BY_ID = '22222222-2222-4222-8222-222222222222';

const validInput = () => ({
  email: 'artist@studio.io',
  role: MemberRole.DESIGNER,
  organizationId: ORG_ID,
  invitedById: INVITED_BY_ID,
});

const makeSut = (existingInvite: Invite | null = null) => {
  const inviteGateway = {
    findByEmailAndOrg: jest.fn().mockResolvedValue(existingInvite),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const inviteTokenService = {
    generate: jest.fn().mockReturnValue('random-token-abc123'),
  };
  const useCase = new CreateInviteUseCase(
    inviteGateway as any,
    inviteTokenService as any,
  );
  return { useCase, inviteGateway, inviteTokenService };
};

describe('CreateInviteUseCase', () => {
  it('creates an invite with token and 7-day expiry', async () => {
    const { useCase, inviteGateway, inviteTokenService } = makeSut(null);

    const before = new Date();
    const output = await useCase.execute(validInput());

    expect(inviteGateway.findByEmailAndOrg).toHaveBeenCalledWith(
      'artist@studio.io',
      ORG_ID,
    );
    expect(inviteTokenService.generate).toHaveBeenCalledTimes(1);
    expect(inviteGateway.create).toHaveBeenCalledTimes(1);

    expect(output.email).toBe('artist@studio.io');
    expect(output.role).toBe(MemberRole.DESIGNER);
    expect(output.token).toBe('random-token-abc123');
    expect(output.id).toBeDefined();

    const sevenDaysFromNow = new Date(before);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    expect(output.expiresAt.getTime()).toBeGreaterThanOrEqual(
      sevenDaysFromNow.getTime() - 1000,
    );
  });

  it('throws EntityValidationError when a pending invite already exists for the email+org', async () => {
    const existingInvite = Invite.create({
      email: 'artist@studio.io',
      role: MemberRole.DESIGNER,
      organizationId: ORG_ID,
      invitedById: INVITED_BY_ID,
      token: 'existing-token',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const { useCase, inviteGateway } = makeSut(existingInvite);

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
    expect(inviteGateway.create).not.toHaveBeenCalled();
  });
});
