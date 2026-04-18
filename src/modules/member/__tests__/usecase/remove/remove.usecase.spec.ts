// src/modules/member/__tests__/usecase/remove/remove.usecase.spec.ts
import RemoveMemberUseCase from '../../../usecase/remove/remove.usecase';
import { Member } from '../../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

const makeSut = (role = MemberRole.DESIGNER, adminCount = 2) => {
  const member = Member.create({ userId, organizationId: orgId, role });
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(member) };
  const repository = {
    countAdmins: jest.fn().mockResolvedValue(adminCount),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new RemoveMemberUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository, member };
};

describe('RemoveMemberUseCase', () => {
  it('soft-deletes a non-admin member', async () => {
    const { useCase, repository, member } = makeSut(MemberRole.DESIGNER);
    await useCase.execute({ id: member.id, organizationId: orgId });
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('throws ForbiddenError when removing last admin', async () => {
    const { useCase, member } = makeSut(MemberRole.ADMIN, 1);
    await expect(
      useCase.execute({ id: member.id, organizationId: orgId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows removing admin when others exist', async () => {
    const { useCase, repository, member } = makeSut(MemberRole.ADMIN, 2);
    await useCase.execute({ id: member.id, organizationId: orgId });
    expect(repository.update).toHaveBeenCalledTimes(1);
  });
});