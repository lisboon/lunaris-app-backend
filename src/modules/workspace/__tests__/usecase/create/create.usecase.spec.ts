import CreateUseCase from '../../../usecase/create/create.usecase';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { Workspace } from '../../../domain/workspace.entity';

const validInput = () => ({
  name: 'Cyberpunk Team',
  organizationId: '11111111-1111-4111-8111-111111111111',
});

const makeSut = (findByNameResult: Workspace | null = null) => {
  const repository = {
    findByName: jest.fn().mockResolvedValue(findByNameResult),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new CreateUseCase(repository as any);
  return { useCase, repository };
};

describe('CreateWorkspaceUseCase', () => {
  it('creates a workspace when no duplicate exists', async () => {
    const { useCase, repository } = makeSut(null);
    const output = await useCase.execute(validInput());

    expect(repository.findByName).toHaveBeenCalledWith(
      'Cyberpunk Team',
      validInput().organizationId,
    );
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(output).toMatchObject({
      name: 'Cyberpunk Team',
      organizationId: validInput().organizationId,
      active: true,
    });
    expect(output.id).toBeDefined();
  });

  it('throws when a workspace with the same name already exists', async () => {
    const existing = Workspace.create(validInput());
    const { useCase, repository } = makeSut(existing);

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('propagates validation errors from the entity', async () => {
    const { useCase, repository } = makeSut(null);
    await expect(
      useCase.execute({ ...validInput(), name: 'x' }),
    ).rejects.toBeInstanceOf(EntityValidationError);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
