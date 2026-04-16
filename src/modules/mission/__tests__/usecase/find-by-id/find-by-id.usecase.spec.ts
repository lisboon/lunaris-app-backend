import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { Mission } from '../../../domain/mission.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';

const workspaceId = '33333333-3333-4333-8333-333333333333';

const makeMission = () =>
  Mission.create({
    id: 'qst_valid',
    name: 'Valid',
    organizationId: orgId,
    workspaceId,
    authorId,
  });

const makeSut = (findByIdResult: Mission | null = null) => {
  const repository = {
    findById: jest.fn().mockResolvedValue(findByIdResult),
  };
  const useCase = new FindByIdUseCase(repository as any);
  return { useCase, repository };
};

describe('FindByIdUseCase', () => {
  it('returns the mission when found', async () => {
    const mission = makeMission();
    const { useCase, repository } = makeSut(mission);

    const result = await useCase.execute({ id: mission.id, organizationId: orgId });

    expect(repository.findById).toHaveBeenCalledWith(mission.id, orgId);
    expect(result).toBe(mission);
  });

  it('throws NotFoundError when missing', async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({ id: 'qst_ghost', organizationId: orgId }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
