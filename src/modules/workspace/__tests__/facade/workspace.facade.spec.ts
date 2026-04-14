import WorkspaceFacade from '../../facade/workspace.facade';
import { Workspace } from '../../domain/workspace.entity';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = () => {
  const workspace = Workspace.create({ name: 'Cyberpunk', organizationId: orgId });
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(workspace) };
  const createUseCase = {
    execute: jest.fn().mockResolvedValue(workspace.toJSON()),
  };
  const searchUseCase = {
    execute: jest.fn().mockResolvedValue({
      items: [workspace.toJSON()],
      total: 1,
      currentPage: 1,
      perPage: 20,
      lastPage: 1,
    }),
  };
  const updateUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
  const deleteUseCase = { execute: jest.fn().mockResolvedValue(undefined) };

  const facade = new WorkspaceFacade(
    findByIdUseCase as any,
    createUseCase as any,
    searchUseCase as any,
    updateUseCase as any,
    deleteUseCase as any,
  );

  return {
    facade,
    workspace,
    findByIdUseCase,
    createUseCase,
    searchUseCase,
    updateUseCase,
    deleteUseCase,
  };
};

describe('WorkspaceFacade', () => {
  it('findById delegates to use case and serializes the entity via toJSON', async () => {
    const { facade, workspace, findByIdUseCase } = makeSut();

    const output = await facade.findById({ id: workspace.id, organizationId: orgId });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: workspace.id,
      organizationId: orgId,
    });
    expect(output).toEqual(workspace.toJSON());
    expect(output).not.toBe(workspace);
  });

  it('create delegates to the create use case and returns its output', async () => {
    const { facade, workspace, createUseCase } = makeSut();
    const input = { name: 'Cyberpunk', organizationId: orgId };

    const output = await facade.create(input);

    expect(createUseCase.execute).toHaveBeenCalledWith(input);
    expect(output).toEqual(workspace.toJSON());
  });

  it('search delegates to the search use case and returns its output', async () => {
    const { facade, searchUseCase } = makeSut();
    const input = { organizationId: orgId, name: 'cy', page: 1, perPage: 20 };

    const output = await facade.search(input);

    expect(searchUseCase.execute).toHaveBeenCalledWith(input);
    expect(output.total).toBe(1);
    expect(output.items).toHaveLength(1);
  });

  it('update delegates to the update use case', async () => {
    const { facade, workspace, updateUseCase } = makeSut();
    const input = { id: workspace.id, organizationId: orgId, name: 'New' };

    await facade.update(input);

    expect(updateUseCase.execute).toHaveBeenCalledWith(input);
  });

  it('delete delegates to the delete use case', async () => {
    const { facade, workspace, deleteUseCase } = makeSut();
    const input = { id: workspace.id, organizationId: orgId };

    await facade.delete(input);

    expect(deleteUseCase.execute).toHaveBeenCalledWith(input);
  });
});
