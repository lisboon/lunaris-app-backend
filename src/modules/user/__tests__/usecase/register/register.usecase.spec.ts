import RegisterUseCase from '../../../usecase/register/register.usecase';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MemberRole } from '@/modules/@shared/domain/enums';

const validInput = () => ({
  email: 'founder@studio.io',
  name: 'Jane Founder',
  password: 'SuperSecret99',
  organizationName: 'CD Projekt',
  organizationSlug: 'cd-projekt',
});

const makeSut = ({
  existingUserByEmail = null,
  existingOrgBySlug = null,
} = {}) => {
  const transactionManager = {
    execute: jest.fn().mockImplementation(async (fn: any) => fn({})),
  };
  const userGateway = {
    findByEmail: jest.fn().mockResolvedValue(existingUserByEmail),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const organizationGateway = {
    findBySlug: jest.fn().mockResolvedValue(existingOrgBySlug),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const memberGateway = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  const passwordHashService = {
    hash: jest.fn().mockResolvedValue('hashed_password'),
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
    const {
      useCase,
      transactionManager,
      userGateway,
      organizationGateway,
      memberGateway,
      passwordHashService,
    } = makeSut();

    const output = await useCase.execute(validInput());

    expect(passwordHashService.hash).toHaveBeenCalledWith('SuperSecret99');
    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(userGateway.create).toHaveBeenCalledTimes(1);
    expect(organizationGateway.create).toHaveBeenCalledTimes(1);
    expect(memberGateway.create).toHaveBeenCalledTimes(1);

    expect(output.user).toMatchObject({
      email: 'founder@studio.io',
      name: 'Jane Founder',
    });
    expect(output.organization).toMatchObject({
      name: 'CD Projekt',
      slug: 'cd-projekt',
    });
    expect(output.member.role).toBe(MemberRole.ADMIN);
  });

  it('throws EntityValidationError when email is already taken', async () => {
    const { useCase, userGateway } = makeSut();
    const existingUser = { id: 'some-id', email: 'founder@studio.io' };
    userGateway.findByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
  });

  it('throws EntityValidationError when slug is already taken', async () => {
    const { useCase, organizationGateway } = makeSut();
    const existingOrg = { id: 'some-id', slug: 'cd-projekt' };
    organizationGateway.findBySlug.mockResolvedValue(existingOrg);

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      EntityValidationError,
    );
  });
});
