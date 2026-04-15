import CreateUseCase from '../../../usecase/create/create.usecase';
import { Mission } from '../../../domain/mission.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';

const validInput = () => ({
  id: 'qst_old_country',
  name: 'The Old Country',
  description: 'desc',
  organizationId: orgId,
  authorId,
});

const makeSut = (findResult: Mission | null = null) => {
  const repository = {
    findById: jest.fn().mockResolvedValue(findResult),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const eventDispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const useCase = new CreateUseCase(repository as any, eventDispatcher as any);
  return { useCase, repository, eventDispatcher };
};

describe('CreateUseCase', () => {
  it('creates a mission when no duplicate exists and dispatches MissionCreatedEvent', async () => {
    const { useCase, repository, eventDispatcher } = makeSut(null);

    const output = await useCase.execute(validInput());

    expect(repository.findById).toHaveBeenCalledWith('qst_old_country', orgId);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(output).toMatchObject({
      id: 'qst_old_country',
      name: 'The Old Country',
      organizationId: orgId,
      authorId,
    });
  });

  it('throws EntityValidationError when a mission with the same id exists', async () => {
    const existing = Mission.create(validInput());
    const { useCase, repository } = makeSut(existing);

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('propagates validation errors from the entity', async () => {
    const { useCase, repository } = makeSut(null);
    await expect(
      useCase.execute({ ...validInput(), id: 'InvalidID' }),
    ).rejects.toBeInstanceOf(EntityValidationError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('does not dispatch events when persistence fails', async () => {
    const { useCase, repository, eventDispatcher } = makeSut(null);
    repository.create.mockRejectedValueOnce(new Error('db down'));
    await expect(useCase.execute(validInput())).rejects.toThrow('db down');
    expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
