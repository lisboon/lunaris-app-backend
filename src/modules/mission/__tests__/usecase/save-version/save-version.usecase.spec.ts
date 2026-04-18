import SaveVersionUseCase from '../../../usecase/save-version/save-version.usecase';
import { DAGValidatorService } from '../../../domain/services/dag-validator.service';
import { MissionHashService } from '../../../domain/services/mission-hash.service';
import { Mission } from '../../../domain/mission.entity';


const orgId = '11111111-1111-4111-8111-111111111111';
const workspaceId = '22222222-2222-4222-8222-222222222222';
const authorId = '33333333-3333-4333-8333-333333333333';

const validGraph = () => ({
  nodes: [
    { id: 'start', type: 'Spawn.Actor', position: { x: 0, y: 0 }, data: {} },
    { id: 'end', type: 'Reward.Give', position: { x: 100, y: 0 }, data: {} },
  ],
  edges: [{ id: 'e1', source: 'start', target: 'end' }],
});

const invalidGraph = () => ({
  nodes: [
    { id: 'a', type: 'Spawn.Actor', position: { x: 0, y: 0 }, data: {} },
    { id: 'b', type: 'Objective.Kill', position: { x: 100, y: 0 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'a', target: 'b' },
    { id: 'e2', source: 'b', target: 'a' },
  ],
});

const validMissionData = () => ({
  mission_id: 'qst_test',
  meta: { version: '1.0.0', hash: '' },
  graph: { start_node: 'start', nodes: {} },
});

const savedVersionRecord = (overrides: any = {}) => ({
  id: 'version-uuid',
  missionId: 'qst_test',
  hash: 'abc123',
  isValid: true,
  validationErrors: null,
  createdAt: new Date(),
  ...overrides,
});

const makeSut = () => {
  const mission = Mission.create({
    id: 'qst_test',
    name: 'Test Mission',
    organizationId: orgId,
    workspaceId,
    authorId,
  });

  const findByIdUseCase = {
    execute: jest.fn().mockResolvedValue(mission),
  };
  const repository = {
    saveVersion: jest.fn().mockResolvedValue(savedVersionRecord()),
  };
  const hashService = new MissionHashService();
  const dagValidator = new DAGValidatorService();

  const useCase = new SaveVersionUseCase(
    repository as any,
    findByIdUseCase as any,
    hashService,
    dagValidator,
  );

  return { useCase, repository, findByIdUseCase, dagValidator };
};

describe('SaveVersionUseCase', () => {
  it('validates graph server-side and saves a valid version', async () => {
    const { useCase, repository } = makeSut();

    const output = await useCase.execute({
      missionId: 'qst_test',
      organizationId: orgId,
      authorId,
      graphData: validGraph(),
      missionData: validMissionData(),
    });

    expect(repository.saveVersion).toHaveBeenCalledTimes(1);
    const persistData = repository.saveVersion.mock.calls[0][0];
    expect(persistData.isValid).toBe(true);
    expect(persistData.validationErrors).toBeNull();
    expect(output.id).toBe('version-uuid');
  });

  it('saves an invalid version with errors when graph has cycles', async () => {
    const { useCase, repository } = makeSut();

    repository.saveVersion.mockResolvedValue(
      savedVersionRecord({ isValid: false, validationErrors: [{ nodeId: 'b', errorType: 'LOOP_DETECTED', message: expect.any(String) }] }),
    );

    await useCase.execute({
      missionId: 'qst_test',
      organizationId: orgId,
      authorId,
      graphData: invalidGraph(),
      missionData: validMissionData(),
    });

    const persistData = repository.saveVersion.mock.calls[0][0];
    expect(persistData.isValid).toBe(false);
    expect(persistData.validationErrors).not.toBeNull();
    expect(persistData.validationErrors.length).toBeGreaterThan(0);
  });

  it('always calls findByIdUseCase to verify mission exists', async () => {
    const { useCase, findByIdUseCase } = makeSut();

    await useCase.execute({
      missionId: 'qst_test',
      organizationId: orgId,
      authorId,
      graphData: validGraph(),
      missionData: validMissionData(),
    });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: 'qst_test',
      organizationId: orgId,
    });
  });
});
