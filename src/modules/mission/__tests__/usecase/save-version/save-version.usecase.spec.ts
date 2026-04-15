import SaveVersionUseCase from '../../../usecase/save-version/save-version.usecase';
import { MissionHashService } from '../../../domain/services/mission-hash.service';
import { Mission } from '../../../domain/mission.entity';
import { MissionContract, CanvasGraph } from '../../../types/mission.types';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';

const missionContract: MissionContract = {
  mission_id: 'qst_old_country',
  meta: { version: '1.0.0', hash: '' },
  graph: { start_node: 'n1', nodes: { n1: { type: 'Objective.Goto' } } },
};
const graphData: CanvasGraph = {
  nodes: [{ id: 'n1', type: 'Objective.Goto', position: { x: 0, y: 0 }, data: {} }],
  edges: [],
};

const makeSut = () => {
  const mission = Mission.create({
    id: 'qst_old_country',
    name: 'Old',
    organizationId: orgId,
    authorId,
  });
  const savedRecord = {
    id: 'version-uuid',
    missionId: mission.id,
    hash: 'precomputed',
    graphData,
    missionData: missionContract,
    isValid: true,
    validationErrors: null,
    authorId,
    createdAt: new Date(),
  };
  const repository = {
    saveVersion: jest.fn().mockResolvedValue(savedRecord),
  };
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const hashService = new MissionHashService();
  const useCase = new SaveVersionUseCase(
    repository as any,
    findByIdUseCase as any,
    hashService,
  );
  return { useCase, repository, findByIdUseCase, hashService, mission, savedRecord };
};

describe('SaveVersionUseCase', () => {
  it('verifies the mission exists, computes hash, and persists the version', async () => {
    const { useCase, repository, findByIdUseCase, hashService } = makeSut();
    const expectedHash = hashService.compute(missionContract);

    const output = await useCase.execute({
      missionId: 'qst_old_country',
      organizationId: orgId,
      authorId,
      graphData,
      missionData: missionContract,
      isValid: true,
    });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: 'qst_old_country',
      organizationId: orgId,
    });
    expect(repository.saveVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: 'qst_old_country',
        organizationId: orgId,
        hash: expectedHash,
        isValid: true,
        validationErrors: null,
      }),
    );
    expect(output).toMatchObject({ id: 'version-uuid', isValid: true });
  });
});
