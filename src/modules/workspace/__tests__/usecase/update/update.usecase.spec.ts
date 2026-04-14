import UpdateUseCase from '../../../usecase/update/update.usecase';
import { Workspace } from '../../../domain/workspace.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const orgId = '11111111-1111-4111-8111-111111111111';

const buildWorkspace = () =>
  Workspace.create({ name: 'Old Name', organizationId: orgId });

const makeSut = (workspace: Workspace = buildWorkspace()) => {
  const repository = {
    update: jest.fn().mockResolvedValue(undefined),
  };
  const findByIdUseCase = {
    execute: jest.fn().mockResolvedValue(workspace),
  };
  const useCase = new UpdateUseCase(
    repository as any,
    findByIdUseCase as any,
  );
  return { useCase, repository, findByIdUseCase, workspace };
};

describe('UpdateWorkspaceUseCase', () => {
  it('updates name and persists through the repository', async () => {
    const { useCase, repository, findByIdUseCase, workspace } = makeSut();

    await useCase.execute({
      id: workspace.id,
      organizationId: orgId,
      name: 'New Name',
    });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: workspace.id,
      organizationId: orgId,
    });
    expect(workspace.name).toBe('New Name');
    expect(repository.update).toHaveBeenCalledWith(workspace);
  });

  it('throws when the new name is invalid and does not persist', async () => {
    const { useCase, repository, workspace } = makeSut();

    await expect(
      useCase.execute({
        id: workspace.id,
        organizationId: orgId,
        name: 'x',
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);

    expect(repository.update).not.toHaveBeenCalled();
  });
});
