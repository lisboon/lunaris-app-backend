import UpdateUseCase from '../../../usecase/update/update.usecase';
import { Mission } from '../../../domain/mission.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';

const workspaceId = '33333333-3333-4333-8333-333333333333';

const makeMission = () =>
  Mission.create({
    id: 'qst_valid',
    name: 'Old',
    organizationId: orgId,
    workspaceId,
    authorId,
  });

const makeSut = () => {
  const mission = makeMission();
  const repository = { update: jest.fn().mockResolvedValue(undefined) };
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(mission) };
  const useCase = new UpdateUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository, findByIdUseCase, mission };
};

describe('UpdateUseCase', () => {
  it('looks up the mission, mutates it, and persists', async () => {
    const { useCase, repository, findByIdUseCase, mission } = makeSut();
    await useCase.execute({ id: mission.id, organizationId: orgId, name: 'New' });
    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: mission.id,
      organizationId: orgId,
    });
    expect(mission.name).toBe('New');
    expect(repository.update).toHaveBeenCalledWith(mission);
  });

  it('throws when the new name is invalid and does not persist', async () => {
    const { useCase, repository, mission } = makeSut();
    await expect(
      useCase.execute({ id: mission.id, organizationId: orgId, name: 'x' }),
    ).rejects.toBeInstanceOf(EntityValidationError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
