import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Member } from '../../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

const validMember = () =>
  Member.create({
    userId: '22222222-2222-4222-8222-222222222222',
    organizationId: ORG_ID,
    role: MemberRole.DESIGNER,
  });

const makeSut = (member: Member | null = null) => {
  const memberGateway = {
    findById: jest.fn().mockResolvedValue(member),
  };
  const useCase = new FindByIdUseCase(memberGateway as any);
  return { useCase, memberGateway };
};

describe('FindByIdMemberUseCase', () => {
  it('returns the member when found', async () => {
    const member = validMember();
    const { useCase, memberGateway } = makeSut(member);

    const result = await useCase.execute({ id: member.id, organizationId: ORG_ID });

    expect(memberGateway.findById).toHaveBeenCalledWith(member.id, ORG_ID);
    expect(result).toBe(member);
  });

  it('throws NotFoundError when member does not exist', async () => {
    const { useCase } = makeSut(null);

    await expect(
      useCase.execute({
        id: '00000000-0000-4000-8000-000000000000',
        organizationId: ORG_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
