import ListVersionsUseCase from '../../../usecase/list-versions/list-versions.usecase';
import { Mission } from '../../../domain/mission.entity';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';

const workspaceId = '33333333-3333-4333-8333-333333333333';

const makeMission = () =>
  Mission.create({
    id: 'qst_old_country',
    name: 'Old',
    organizationId: orgId,
    workspaceId,
    authorId,
  });

const makeSut = () => {
  const mission = makeMission();
  const repository = {
    findVersionsByMissionId: jest.fn().mockResolvedValue({
      items: [
        {
          id: 'v1',
          missionId: mission.id,
          hash: 'h1',
          isValid: true,
          validationErrors: null,
          authorId,
          createdAt: new Date(),
        },
      ],
      total: 1,
    }),
  };
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const useCase = new ListVersionsUseCase(
    repository as any,
    findByIdUseCase as any,
  );
  return { useCase, repository, findByIdUseCase, mission };
};

describe('ListVersionsUseCase', () => {
  it('defaults to page=1 perPage=20 and returns a SearchResult', async () => {
    const { useCase, repository, mission } = makeSut();
    const result = await useCase.execute({
      missionId: mission.id,
      organizationId: orgId,
    });
    expect(repository.findVersionsByMissionId).toHaveBeenCalledWith(
      mission.id,
      orgId,
      1,
      20,
    );
    expect(result.total).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.lastPage).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('honours custom pagination', async () => {
    const { useCase, repository, mission } = makeSut();
    await useCase.execute({
      missionId: mission.id,
      organizationId: orgId,
      page: 3,
      perPage: 5,
    });
    expect(repository.findVersionsByMissionId).toHaveBeenCalledWith(
      mission.id,
      orgId,
      3,
      5,
    );
  });
});
