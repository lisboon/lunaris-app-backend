import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { Member } from '../../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import RemoveMemberUseCase from '@/modules/member/usecase/remove/remove.usecase';

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
  const useCase = new RemoveMemberUseCase(
    memberGateway as any,
    findByIdUseCase as any,
  );
  return { useCase, memberGateway, findByIdUseCase };
};

describe('RemoveMemberUseCase', () => {
  it('soft-deletes a non-admin member without checking admin count', async () => {
    const member = designerMember();
    const { useCase, memberGateway } = makeSut(member, 1);

    await useCase.execute({ id: member.id, organizationId: ORG_ID });

    expect(memberGateway.countAdmins).not.toHaveBeenCalled();
    expect(memberGateway.update).toHaveBeenCalledTimes(1);
    expect(member.deletedAt).toBeDefined();
  });

  it('soft-deletes an admin when there are multiple admins', async () => {
    const member = adminMember();
    const { useCase, memberGateway } = makeSut(member, 2);

    await useCase.execute({ id: member.id, organizationId: ORG_ID });

    expect(memberGateway.countAdmins).toHaveBeenCalledWith(ORG_ID);
    expect(memberGateway.update).toHaveBeenCalledTimes(1);
    expect(member.deletedAt).toBeDefined();
  });

  it('throws ForbiddenError when removing the last admin', async () => {
    const member = adminMember();
    const { useCase, memberGateway } = makeSut(member, 1);

    await expect(
      useCase.execute({ id: member.id, organizationId: ORG_ID }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(memberGateway.update).not.toHaveBeenCalled();
  });
});
