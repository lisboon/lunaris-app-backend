import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { User } from '../../../domain/user.entity';

const validUser = () =>
  User.create({
    email: 'player@lunaris.io',
    name: 'Player One',
    password: 'hashed_password',
  });

const makeSut = (user: User | null = null) => {
  const userGateway = {
    findById: jest.fn().mockResolvedValue(user),
  };
  const useCase = new FindByIdUseCase(userGateway as any);
  return { useCase, userGateway };
};

describe('FindByIdUserUseCase', () => {
  it('returns the user when found', async () => {
    const user = validUser();
    const { useCase, userGateway } = makeSut(user);

    const result = await useCase.execute({ id: user.id });

    expect(userGateway.findById).toHaveBeenCalledWith(user.id);
    expect(result).toBe(user);
  });

  it('throws NotFoundError when user does not exist', async () => {
    const { useCase } = makeSut(null);

    await expect(
      useCase.execute({ id: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
