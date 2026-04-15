import PublishUseCase from '../../../usecase/publish/publish.usecase';
import { Mission } from '../../../domain/mission.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';
const validHash = 'a'.repeat(64);

const buildVersion = (overrides: Partial<{ isValid: boolean }> = {}) => ({
  id: 'v1',
  missionId: 'qst_old_country',
  hash: validHash,
  graphData: { nodes: [], edges: [] },
  missionData: { mission_id: 'qst_old_country', meta: { version: '1', hash: validHash }, graph: { start_node: 'n1', nodes: {} } },
  isValid: true,
  validationErrors: null,
  authorId,
  createdAt: new Date(),
  ...overrides,
});

const makeSut = (versionResult: any = buildVersion()) => {
  const mission = Mission.create({
    id: 'qst_old_country',
    name: 'Old',
    organizationId: orgId,
    authorId,
  });
  mission.pullEvents();
  const repository = {
    findVersionByHash: jest.fn().mockResolvedValue(versionResult),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const eventDispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const useCase = new PublishUseCase(
    repository as any,
    findByIdUseCase as any,
    eventDispatcher as any,
  );
  return { useCase, repository, eventDispatcher, mission };
};

describe('PublishUseCase', () => {
  it('publishes a valid version and dispatches MissionPublishedEvent', async () => {
    const { useCase, repository, eventDispatcher, mission } = makeSut();

    const output = await useCase.execute({
      missionId: 'qst_old_country',
      organizationId: orgId,
      versionHash: validHash,
    });

    expect(repository.update).toHaveBeenCalledWith(mission);
    expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(output.activeHash).toBe(validHash);
    expect(output.status).toBe('APPROVED');
  });

  it('throws NotFoundError when the version does not exist', async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({
        missionId: 'qst_old_country',
        organizationId: orgId,
        versionHash: validHash,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws EntityValidationError when the version is invalid', async () => {
    const { useCase, repository } = makeSut(buildVersion({ isValid: false }));
    await expect(
      useCase.execute({
        missionId: 'qst_old_country',
        organizationId: orgId,
        versionHash: validHash,
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
