import DeleteUseCase from '../../../usecase/delete/delete.usecase';
import { Workspace } from '../../../domain/workspace.entity';

const orgId = '11111111-1111-4111-8111-111111111111';

const buildWorkspace = () =>
  Workspace.create({ name: 'To Delete', organizationId: orgId });

const makeSut = () => {
  const workspace = buildWorkspace();
  const repository = {
    update: jest.fn().mockResolvedValue(undefined),
  };
  const findByIdUseCase = {
    execute: jest.fn().mockResolvedValue(workspace),
  };
  const useCase = new DeleteUseCase(
    repository as any,
    findByIdUseCase as any,
  );
  return { useCase, repository, findByIdUseCase, workspace };
};

describe('DeleteWorkspaceUseCase', () => {
  it('soft-deletes the workspace and persists it', async () => {
    const { useCase, repository, workspace } = makeSut();

    await useCase.execute({ id: workspace.id, organizationId: orgId });

    expect(workspace.active).toBe(false);
    expect(workspace.deletedAt).toBeInstanceOf(Date);
    expect(repository.update).toHaveBeenCalledWith(workspace);
  });

  it('forwards the lookup through findByIdUseCase with tenant scope', async () => {
    const { useCase, findByIdUseCase, workspace } = makeSut();

    await useCase.execute({ id: workspace.id, organizationId: orgId });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: workspace.id,
      organizationId: orgId,
    });
  });
});
