import GetActiveUseCase from '../../../usecase/get-active/get-active.usecase';
import { Mission } from '../../../domain/mission.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';
const validHash = 'a'.repeat(64);

const workspaceId = '33333333-3333-4333-8333-333333333333';

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

const contract = {
  mission_id: 'qst_old_country',
  meta: { version: '1', hash: validHash },
  graph: { start_node: 'n1', nodes: {} },
};

const makeSut = (mission: Mission, versionResult: any) => {
  const repository = {
    findVersionByHash: jest.fn().mockResolvedValue(versionResult),
  };
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const useCase = new GetActiveUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository };
};

describe('GetActiveUseCase', () => {
  it('returns the active mission contract', async () => {
    const mission = makeMission(true);
    const { useCase } = makeSut(mission, {
      missionData: contract,
      hash: validHash,
      isValid: true,
      validationErrors: null,
      id: 'v1',
      missionId: mission.id,
      graphData: { nodes: [], edges: [] },
      authorId,
      createdAt: new Date(),
    });

    const result = await useCase.execute({
      missionId: mission.id,
      organizationId: orgId,
    });

    expect(result).toEqual(contract);
  });

  it('throws NotFoundError when the mission has no active version', async () => {
    const mission = makeMission(false);
    const { useCase } = makeSut(mission, null);
    await expect(
      useCase.execute({ missionId: mission.id, organizationId: orgId }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when the active version row is missing', async () => {
    const mission = makeMission(true);
    const { useCase } = makeSut(mission, null);
    await expect(
      useCase.execute({ missionId: mission.id, organizationId: orgId }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
