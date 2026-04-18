import ListByOrganizationUseCase from '../../../usecase/list-by-organization/list-by-organization.usecase';
import { Member } from '../../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

const makeSut = (members: Member[] = []) => {
  const memberGateway = {
    findByOrganization: jest.fn().mockResolvedValue(members),
  };
  const useCase = new ListByOrganizationUseCase(memberGateway as any);
  return { useCase, memberGateway };
};

describe('ListByOrganizationUseCase', () => {
  it('returns all members as toJSON', async () => {
    const member1 = Member.create({
      userId: '22222222-2222-4222-8222-222222222222',
      organizationId: ORG_ID,
      role: MemberRole.ADMIN,
    });
    const member2 = Member.create({
      userId: '33333333-3333-4333-8333-333333333333',
      organizationId: ORG_ID,
      role: MemberRole.DESIGNER,
    });

    const { useCase, memberGateway } = makeSut([member1, member2]);

    const result = await useCase.execute({ organizationId: ORG_ID });

    expect(memberGateway.findByOrganization).toHaveBeenCalledWith(ORG_ID);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ role: MemberRole.ADMIN });
    expect(result[1]).toMatchObject({ role: MemberRole.DESIGNER });
  });

  it('returns empty array when no members', async () => {
    const { useCase } = makeSut([]);
    const result = await useCase.execute({ organizationId: ORG_ID });
    expect(result).toEqual([]);
  });
});
