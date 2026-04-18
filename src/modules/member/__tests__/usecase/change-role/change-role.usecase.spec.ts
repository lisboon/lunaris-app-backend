import ChangeRoleUseCase from '../../../usecase/change-role/change-role.usecase';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { Member } from '../../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

const adminMember = () =>
  Member.create({
    userId: '22222222-2222-4222-8222-222222222222',
    organizationId: ORG_ID,
    role: MemberRole.ADMIN,
  });

const designerMember = () =>
  Member.create({
    userId: '33333333-3333-4333-8333-333333333333',
    organizationId: ORG_ID,
    role: MemberRole.DESIGNER,
  });

const makeSut = (member: Member, adminCount: number = 2) => {
  const memberGateway = {
    countAdmins: jest.fn().mockResolvedValue(adminCount),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const findByIdUseCase = {
    execute: jest.fn().mockResolvedValue(member),
  };
  const transactionManager = {
    execute: jest.fn().mockImplementation(async (fn: any) => fn({ trx: true })),
  };
  const useCase = new ChangeRoleUseCase(
    memberGateway as any,
    findByIdUseCase as any,
    transactionManager as any,
  );
  return { useCase, memberGateway, findByIdUseCase, transactionManager };
};

describe('ChangeRoleUseCase', () => {
  it('changes role from ADMIN to DESIGNER when there are multiple admins', async () => {
    const member = adminMember();
    const { useCase, memberGateway } = makeSut(member, 2);

    await useCase.execute({
      id: member.id,
      organizationId: ORG_ID,
      role: MemberRole.DESIGNER,
    });

    expect(memberGateway.countAdmins).toHaveBeenCalledWith(
      ORG_ID,
      expect.objectContaining({ trx: true }),
    );
    expect(memberGateway.update).toHaveBeenCalledTimes(1);
    expect(member.role).toBe(MemberRole.DESIGNER);
  });

  it('throws ForbiddenError when demoting the last admin', async () => {
    const member = adminMember();
    const { useCase, memberGateway } = makeSut(member, 1);

    await expect(
      useCase.execute({
        id: member.id,
        organizationId: ORG_ID,
        role: MemberRole.DESIGNER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(memberGateway.update).not.toHaveBeenCalled();
  });

  it('does not check admin count when promoting to ADMIN', async () => {
    const member = designerMember();
    const { useCase, memberGateway } = makeSut(member, 1);

    await useCase.execute({
      id: member.id,
      organizationId: ORG_ID,
      role: MemberRole.ADMIN,
    });

    expect(memberGateway.countAdmins).not.toHaveBeenCalled();
    expect(memberGateway.update).toHaveBeenCalledTimes(1);
  });

  it('does not check admin count when changing between non-admin roles', async () => {
    const member = designerMember();
    const { useCase, memberGateway } = makeSut(member, 1);

    await useCase.execute({
      id: member.id,
      organizationId: ORG_ID,
      role: MemberRole.VIEWER,
    });

    expect(memberGateway.countAdmins).not.toHaveBeenCalled();
    expect(memberGateway.update).toHaveBeenCalledTimes(1);
  });

  it('runs countAdmins and update inside the same transaction', async () => {
    const member = adminMember();
    const { useCase, memberGateway, transactionManager } = makeSut(member, 2);

    await useCase.execute({
      id: member.id,
      organizationId: ORG_ID,
      role: MemberRole.DESIGNER,
    });

    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(memberGateway.update).toHaveBeenCalledWith(
      member,
      expect.objectContaining({ trx: true }),
    );
  });
});
