import ChangeRoleUseCase from '../../../usecase/change-role/change-role.usecase';
import { Member } from '../../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

const makeSut = (adminCount = 2) => {
  const member = Member.create({ userId, organizationId: orgId, role: MemberRole.ADMIN });
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(member) };
  const repository = {
    countAdmins: jest.fn().mockResolvedValue(adminCount),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new ChangeRoleUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository, member };
};

describe('ChangeRoleUseCase', () => {
  it('changes role when multiple admins exist', async () => {
    const { useCase, repository, member } = makeSut(2);
    await useCase.execute({ id: member.id, organizationId: orgId, role: MemberRole.DESIGNER });
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('throws ForbiddenError when demoting last admin', async () => {
    const { useCase, member } = makeSut(1);
    await expect(
      useCase.execute({ id: member.id, organizationId: orgId, role: MemberRole.VIEWER }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows role change for non-admin members regardless of count', async () => {
    const member = Member.create({ userId, organizationId: orgId, role: MemberRole.DESIGNER });
    const findByIdUseCase = { execute: jest.fn().mockResolvedValue(member) };
    const repository = { countAdmins: jest.fn(), update: jest.fn().mockResolvedValue(undefined) };
    const useCase = new ChangeRoleUseCase(repository as any, findByIdUseCase as any);

    await useCase.execute({ id: member.id, organizationId: orgId, role: MemberRole.VIEWER });
    expect(repository.countAdmins).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledTimes(1);
  });
});