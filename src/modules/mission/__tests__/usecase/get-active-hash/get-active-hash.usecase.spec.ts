import GetActiveHashUseCase from '../../../usecase/get-active-hash/get-active-hash.usecase';
import { Mission } from '../../../domain/mission.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';
const workspaceId = '33333333-3333-4333-8333-333333333333';
const validHash = 'a'.repeat(64);

const makeMission = (withActive = true) => {
  const m = Mission.create({
    id: 'qst_old_country',
    name: 'Old',
    organizationId: orgId,
    workspaceId,
    authorId,
  });
  if (withActive) m.publish(validHash);
  m.pullEvents();
  return m;
};

const makeSut = (mission: Mission) => {
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const useCase = new GetActiveHashUseCase(findByIdUseCase as any);
  return { useCase, findByIdUseCase };
};

describe('GetActiveHashUseCase', () => {
  it('returns the active hash of the mission', async () => {
    const mission = makeMission(true);
    const { useCase } = makeSut(mission);

    const result = await useCase.execute({
      missionId: mission.id,
      organizationId: orgId,
    });

    expect(result).toEqual({ hash: validHash });
  });

  it('throws NotFoundError when the mission has no active version', async () => {
    const mission = makeMission(false);
    const { useCase } = makeSut(mission);

    await expect(
      useCase.execute({ missionId: mission.id, organizationId: orgId }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delegates mission lookup to FindByIdUseCase (single point of not-found)', async () => {
    const mission = makeMission(true);
    const { useCase, findByIdUseCase } = makeSut(mission);

    await useCase.execute({ missionId: mission.id, organizationId: orgId });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: mission.id,
      organizationId: orgId,
    });
  });
});
