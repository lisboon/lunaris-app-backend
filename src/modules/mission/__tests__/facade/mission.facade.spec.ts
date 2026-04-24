import MissionFacade from '../../facade/mission.facade';
import { Mission } from '../../domain/mission.entity';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';

const workspaceId = '33333333-3333-4333-8333-333333333333';

const makeSut = () => {
  const mission = Mission.create({
    id: 'qst_old_country',
    name: 'Old',
    organizationId: orgId,
    workspaceId,
    authorId,
  });

  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const createUseCase = {
    execute: jest.fn().mockResolvedValue(mission.toJSON()),
  };
  const updateUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
  const saveVersionUseCase = {
    execute: jest.fn().mockResolvedValue({
      id: 'v1',
      missionId: mission.id,
      hash: 'h',
      isValid: true,
      validationErrors: null,
      createdAt: new Date(),
    }),
  };
  const publishUseCase = {
    execute: jest.fn().mockResolvedValue({
      id: mission.id,
      name: mission.name,
      status: 'APPROVED',
      activeHash: 'h',
      updatedAt: new Date(),
    }),
  };
  const listVersionsUseCase = {
    execute: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      currentPage: 1,
      perPage: 20,
      lastPage: 0,
    }),
  };
  const getActiveUseCase = {
    execute: jest.fn().mockResolvedValue({
      mission_id: mission.id,
      meta: { version: '1', hash: 'h' },
      graph: { start_node: 'n1', nodes: {} },
    }),
  };
  const getActiveHashUseCase = {
    execute: jest.fn().mockResolvedValue({ hash: 'h' }),
  };

  const facade = new MissionFacade(
    findByIdUseCase as any,
    createUseCase as any,
    updateUseCase as any,
    saveVersionUseCase as any,
    publishUseCase as any,
    listVersionsUseCase as any,
    getActiveUseCase as any,
    getActiveHashUseCase as any,
  );

  return {
    facade,
    mission,
    findByIdUseCase,
    createUseCase,
    updateUseCase,
    saveVersionUseCase,
    publishUseCase,
    listVersionsUseCase,
    getActiveUseCase,
    getActiveHashUseCase,
  };
};

describe('MissionFacade', () => {
  it('findById delegates and serializes via toJSON', async () => {
    const { facade, mission, findByIdUseCase } = makeSut();
    const out = await facade.findById({
      id: mission.id,
      organizationId: orgId,
    });
    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: mission.id,
      organizationId: orgId,
    });
    expect(out).toEqual(mission.toJSON());
  });

  it('create delegates to create use case', async () => {
    const { facade, mission, createUseCase } = makeSut();
    const input = {
      id: mission.id,
      name: mission.name,
      organizationId: orgId,
      workspaceId,
      authorId,
    };
    const out = await facade.create(input);
    expect(createUseCase.execute).toHaveBeenCalledWith(input);
    expect(out).toEqual(mission.toJSON());
  });

  it('update delegates to update use case', async () => {
    const { facade, mission, updateUseCase } = makeSut();
    const input = { id: mission.id, organizationId: orgId, name: 'New' };
    await facade.update(input);
    expect(updateUseCase.execute).toHaveBeenCalledWith(input);
  });

  it('saveVersion delegates', async () => {
    const { facade, mission, saveVersionUseCase } = makeSut();
    const input = {
      missionId: mission.id,
      organizationId: orgId,
      authorId,
      graphData: { nodes: [], edges: [] },
      missionData: {
        mission_id: mission.id,
        meta: { version: '1', hash: '' },
        graph: { start_node: 'n1', nodes: {} },
      },
      isValid: true,
    };
    const out = await facade.saveVersion(input);
    expect(saveVersionUseCase.execute).toHaveBeenCalledWith(input);
    expect(out.id).toBe('v1');
  });

  it('publish delegates', async () => {
    const { facade, mission, publishUseCase } = makeSut();
    const input = {
      missionId: mission.id,
      organizationId: orgId,
      versionHash: 'h',
    };
    const out = await facade.publish(input);
    expect(publishUseCase.execute).toHaveBeenCalledWith(input);
    expect(out.activeHash).toBe('h');
  });

  it('listVersions delegates', async () => {
    const { facade, mission, listVersionsUseCase } = makeSut();
    const input = {
      missionId: mission.id,
      organizationId: orgId,
      page: 1,
      perPage: 20,
    };
    const out = await facade.listVersions(input);
    expect(listVersionsUseCase.execute).toHaveBeenCalledWith(input);
    expect(out.total).toBe(0);
  });

  it('getActive delegates', async () => {
    const { facade, mission, getActiveUseCase } = makeSut();
    const input = { missionId: mission.id, organizationId: orgId };
    const out = await facade.getActive(input);
    expect(getActiveUseCase.execute).toHaveBeenCalledWith(input);
    expect(out.mission_id).toBe(mission.id);
  });

  it('getActiveHash delegates', async () => {
    const { facade, mission, getActiveHashUseCase } = makeSut();
    const input = { missionId: mission.id, organizationId: orgId };
    const out = await facade.getActiveHash(input);
    expect(getActiveHashUseCase.execute).toHaveBeenCalledWith(input);
    expect(out).toEqual({ hash: 'h' });
  });
});
