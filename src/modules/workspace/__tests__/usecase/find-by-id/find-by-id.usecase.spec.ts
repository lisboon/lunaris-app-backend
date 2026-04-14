import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { Workspace } from '../../../domain/workspace.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const validInput = () => ({
  id: '22222222-2222-4222-8222-222222222222',
  organizationId: '11111111-1111-4111-8111-111111111111',
});

const makeSut = (findByIdResult: Workspace | null = null) => {
  const repository = {
    findById: jest.fn().mockResolvedValue(findByIdResult),
  };
  const useCase = new FindByIdUseCase(repository as any);
  return { useCase, repository };
};

describe('FindWorkspaceByIdUseCase', () => {
  it('returns the workspace when found', async () => {
    const workspace = Workspace.create({
      id: validInput().id,
      name: 'Cyberpunk',
      organizationId: validInput().organizationId,
    });
    const { useCase, repository } = makeSut(workspace);

    const result = await useCase.execute(validInput());

    expect(repository.findById).toHaveBeenCalledWith(
      validInput().id,
      validInput().organizationId,
    );
    expect(result).toBe(workspace);
  });

  it('throws NotFoundError when the workspace does not exist', async () => {
    const { useCase } = makeSut(null);
    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
