import MemberFacade from '../../facade/member.facade';
import { Member } from '../../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = () => {
  const member = Member.create({
    userId: '22222222-2222-4222-8222-222222222222',
    organizationId: orgId,
    role: MemberRole.ADMIN,
  });

  const listOutput = [member.toJSON()];

  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(member) };
  const listByOrganizationUseCase = { execute: jest.fn().mockResolvedValue(listOutput) };
  const changeRoleUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
  const removeUseCase = { execute: jest.fn().mockResolvedValue(undefined) };

  const facade = new MemberFacade(
    findByIdUseCase as any,
    listByOrganizationUseCase as any,
    changeRoleUseCase as any,
    removeUseCase as any,
  );

  return {
    facade,
    member,
    listOutput,
    findByIdUseCase,
    listByOrganizationUseCase,
    changeRoleUseCase,
    removeUseCase,
  };
};

describe('MemberFacade', () => {
  it('findById delegates to use case and serializes the entity via toJSON', async () => {
    const { facade, member, findByIdUseCase } = makeSut();

    const output = await facade.findById({ id: member.id, organizationId: orgId });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({ id: member.id, organizationId: orgId });
    expect(output).toEqual(member.toJSON());
    expect(output).not.toBe(member);
  });

  it('listByOrganization delegates to use case and returns its output', async () => {
    const { facade, listOutput, listByOrganizationUseCase } = makeSut();

    const output = await facade.listByOrganization({ organizationId: orgId });

    expect(listByOrganizationUseCase.execute).toHaveBeenCalledWith({ organizationId: orgId });
    expect(output).toEqual(listOutput);
  });

  it('changeRole delegates to use case', async () => {
    const { facade, member, changeRoleUseCase } = makeSut();
    const input = { id: member.id, organizationId: orgId, role: MemberRole.DESIGNER };

    await facade.changeRole(input);

    expect(changeRoleUseCase.execute).toHaveBeenCalledWith(input);
  });

  it('remove delegates to use case', async () => {
    const { facade, member, removeUseCase } = makeSut();
    const input = { id: member.id, organizationId: orgId };

    await facade.remove(input);

    expect(removeUseCase.execute).toHaveBeenCalledWith(input);
  });
});
