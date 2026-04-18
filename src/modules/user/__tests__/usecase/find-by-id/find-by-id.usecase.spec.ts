import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { User } from '../../../domain/user.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const makeSut = () => {
  const user = User.create({
    email: 'john@studio.com',
    name: 'John Doe',
    password: 'hashed_password',
  });
  const repository = {
    findById: jest.fn().mockResolvedValue(user),
  };
  const useCase = new FindByIdUseCase(repository as any);
  return { useCase, repository, user };
};

describe('FindByIdUseCase (User)', () => {
  it('returns the user when found', async () => {
    const { useCase, user } = makeSut();
    const result = await useCase.execute({ id: user.id });
    expect(result.id).toBe(user.id);
    expect(result.email).toBe('john@studio.com');
  });

  it('throws NotFoundError when user does not exist', async () => {
    const { useCase, repository } = makeSut();
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});