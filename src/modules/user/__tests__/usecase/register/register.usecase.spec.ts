import RegisterUseCase from '../../../usecase/register/register.usecase';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const validInput = () => ({
  email: 'john@studio.com',
  name: 'John Doe',
  password: 'secureP@ss123',
  organizationName: 'CD Projekt Red',
  organizationSlug: 'cd-projekt-red',
});

const makeSut = () => {
  const transactionManager = {
    execute: jest.fn().mockImplementation((fn) => fn({})),
  };
  const userGateway = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const organizationGateway = {
    findBySlug: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const memberGateway = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  const passwordHashService = {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
  };

  const useCase = new RegisterUseCase(
    transactionManager as any,
    userGateway as any,
    organizationGateway as any,
    memberGateway as any,
    passwordHashService as any,
  );

  return {
    useCase,
    transactionManager,
    userGateway,
    organizationGateway,
    memberGateway,
    passwordHashService,
  };
};

describe('RegisterUseCase', () => {
  it('creates user, organization, and member atomically', async () => {
    const { useCase, transactionManager, userGateway, organizationGateway, memberGateway } = makeSut();

    const output = await useCase.execute(validInput());

    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(userGateway.create).toHaveBeenCalledTimes(1);
    expect(organizationGateway.create).toHaveBeenCalledTimes(1);
    expect(memberGateway.create).toHaveBeenCalledTimes(1);

    expect(output.user.email).toBe('john@studio.com');
    expect(output.user.name).toBe('John Doe');
    expect(output.organization.name).toBe('CD Projekt Red');
    expect(output.organization.slug).toBe('cd-projekt-red');
    expect(output.member.role).toBe('ADMIN');
  });

  it('hashes the password before creating the user', async () => {
    const { useCase, passwordHashService } = makeSut();

    await useCase.execute(validInput());

    expect(passwordHashService.hash).toHaveBeenCalledWith('secureP@ss123');
  });

  it('throws when email already exists', async () => {
    const { useCase, userGateway } = makeSut();
    userGateway.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
  });

  it('throws when organization slug already exists', async () => {
    const { useCase, organizationGateway } = makeSut();
    organizationGateway.findBySlug.mockResolvedValue({ id: 'existing' });

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
  });
});