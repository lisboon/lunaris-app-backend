import ListInvitesUseCase from '../../../usecase/list-invites/list-invites.usecase';
import { Invite } from '../../../domain/invite.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const INVITED_BY_ID = '22222222-2222-4222-8222-222222222222';

const makeInvite = (email: string) =>
  Invite.create({
    email,
    role: MemberRole.DESIGNER,
    organizationId: ORG_ID,
    invitedById: INVITED_BY_ID,
    token: `token-${email}`,
    expiresAt: new Date(Date.now() + 86400000),
  });

const makeSut = (invites: Invite[] = []) => {
  const inviteGateway = {
    findByOrganization: jest.fn().mockResolvedValue(invites),
  };
  const useCase = new ListInvitesUseCase(inviteGateway as any);
  return { useCase, inviteGateway };
};

describe('ListInvitesUseCase', () => {
  it('returns all invites as toJSON', async () => {
    const invites = [makeInvite('a@x.io'), makeInvite('b@x.io')];
    const { useCase, inviteGateway } = makeSut(invites);

    const result = await useCase.execute({ organizationId: ORG_ID });

    expect(inviteGateway.findByOrganization).toHaveBeenCalledWith(ORG_ID);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no invites', async () => {
    const { useCase } = makeSut([]);
    const result = await useCase.execute({ organizationId: ORG_ID });
    expect(result).toEqual([]);
  });
});
