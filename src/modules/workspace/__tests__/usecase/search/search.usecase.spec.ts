import SearchUseCase from '../../../usecase/search/search.usecase';
import { Workspace } from '../../../domain/workspace.entity';
import { SearchResult } from '@/modules/@shared/repository/search-result';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = (items: Workspace[] = [], total = 0) => {
  const result = new SearchResult<Workspace>({
    items,
    total,
    currentPage: 1,
    perPage: 20,
  });
  const repository = {
    search: jest.fn().mockResolvedValue(result),
  };
  const useCase = new SearchUseCase(repository as any);
  return { useCase, repository };
};

describe('SearchWorkspaceUseCase', () => {
  it('splits filter fields from pagination and forwards both', async () => {
    const { useCase, repository } = makeSut([], 0);

    await useCase.execute({
      organizationId: orgId,
      name: 'cyber',
      active: true,
      sort: 'name',
      sortDir: 'asc',
      page: 2,
      perPage: 10,
    });

    expect(repository.search).toHaveBeenCalledWith({
      filter: { organizationId: orgId, name: 'cyber', active: true },
      sort: 'name',
      sortDir: 'asc',
      page: 2,
      perPage: 10,
    });
  });

  it('maps entities to plain DTOs in the output', async () => {
    const workspace = Workspace.create({
      name: 'Cyberpunk',
      organizationId: orgId,
    });
    const { useCase } = makeSut([workspace], 1);

    const output = await useCase.execute({ organizationId: orgId });

    expect(output.total).toBe(1);
    expect(output.currentPage).toBe(1);
    expect(output.perPage).toBe(20);
    expect(output.lastPage).toBe(1);
    expect(output.items[0]).toMatchObject({
      id: workspace.id,
      name: 'Cyberpunk',
      organizationId: orgId,
    });
  });

  it('returns empty list when no items match', async () => {
    const { useCase } = makeSut([], 0);
    const output = await useCase.execute({ organizationId: orgId });
    expect(output.items).toEqual([]);
    expect(output.total).toBe(0);
    expect(output.lastPage).toBe(0);
  });
});
