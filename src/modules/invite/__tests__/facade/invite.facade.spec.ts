import InviteFacade from '../../facade/invite.facade';
import { MemberRole } from '@/modules/@shared/domain/enums';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = () => {
  const createOutput = {
    id: 'invite-id',
    email: 'dev@example.com',
    role: MemberRole.DESIGNER,
    organizationId: orgId,
    token: 'token-abc',
    expiresAt: new Date(),
  };

  const acceptOutput = {
    userId: 'user-id',
    memberId: 'member-id',
    organizationId: orgId,
  };

  const listOutput = [{ id: 'invite-id', email: 'dev@example.com' }];

  const createUseCase = { execute: jest.fn().mockResolvedValue(createOutput) };
  const acceptUseCase = { execute: jest.fn().mockResolvedValue(acceptOutput) };
  const cancelUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
  const listUseCase = { execute: jest.fn().mockResolvedValue(listOutput) };
  const resendUseCase = { execute: jest.fn().mockResolvedValue(undefined) };

  const facade = new InviteFacade(
    createUseCase as any,
    acceptUseCase as any,
    cancelUseCase as any,
    listUseCase as any,
    resendUseCase as any,
  );

  return {
    facade,
    createOutput,
    acceptOutput,
    listOutput,
    createUseCase,
    acceptUseCase,
    cancelUseCase,
    listUseCase,
    resendUseCase,
  };
};

describe('InviteFacade', () => {
  it('create delegates to use case and returns its output', async () => {
    const { facade, createOutput, createUseCase } = makeSut();
    const input = {
      email: 'dev@example.com',
      role: MemberRole.DESIGNER,
      organizationId: orgId,
      invitedById: 'member-id',
    };

    const output = await facade.create(input);

    expect(createUseCase.execute).toHaveBeenCalledWith(input);
    expect(output).toEqual(createOutput);
  });

  it('accept delegates to use case and returns its output', async () => {
    const { facade, acceptOutput, acceptUseCase } = makeSut();
    const input = { token: 'token-abc', name: 'Dev', password: 'secret123' };

    const output = await facade.accept(input);

    expect(acceptUseCase.execute).toHaveBeenCalledWith(input);
    expect(output).toEqual(acceptOutput);
  });

  it('cancel delegates to use case', async () => {
    const { facade, cancelUseCase } = makeSut();
    const input = { id: 'invite-id', organizationId: orgId };

    await facade.cancel(input);

    expect(cancelUseCase.execute).toHaveBeenCalledWith(input);
  });

  it('list delegates to use case and returns its output', async () => {
    const { facade, listOutput, listUseCase } = makeSut();

    const output = await facade.list({ organizationId: orgId });

    expect(listUseCase.execute).toHaveBeenCalledWith({ organizationId: orgId });
    expect(output).toEqual(listOutput);
  });

  it('resend delegates to use case', async () => {
    const { facade, resendUseCase } = makeSut();
    const input = { id: 'invite-id', organizationId: orgId };

    await facade.resend(input);

    expect(resendUseCase.execute).toHaveBeenCalledWith(input);
  });
});
