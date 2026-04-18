import LoginUseCase from '../../../usecase/login/login.usecase';
import { User } from '../../../domain/user.entity';
import { Member } from '@/modules/member/domain/member.entity';
import { Organization } from '@/modules/organization/domain/organization.entity';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { MemberRole } from '@/modules/@shared/domain/enums';

const makeSut = () => {
  const user = User.create({
    email: 'john@studio.com',
    name: 'John Doe',
    password: 'hashed_password',
  });
  const organization = Organization.create({
    name: 'CD Projekt Red',
    slug: 'cd-projekt-red',
  });
  const member = Member.create({
    userId: user.id,
    organizationId: organization.id,
    role: MemberRole.ADMIN,
  });

  const userGateway = {
    findByEmail: jest.fn().mockResolvedValue(user),
  };
  const memberGateway = {
    findByUserId: jest.fn().mockResolvedValue(member),
  };
  const organizationGateway = {
    findById: jest.fn().mockResolvedValue(organization),
  };
  const passwordHashService = {
    hash: jest.fn(),
    compare: jest.fn().mockResolvedValue(true),
  };
  const jwtTokenService = {
    sign: jest.fn().mockReturnValue('jwt-token-here'),
    verify: jest.fn(),
  };

  const useCase = new LoginUseCase(
    userGateway as any,
    memberGateway as any,
    organizationGateway as any,
    passwordHashService as any,
    jwtTokenService as any,
  );

  return {
    useCase,
    user,
    member,
    organization,
    userGateway,
    memberGateway,
    organizationGateway,
    passwordHashService,
    jwtTokenService,
  };
};

describe('LoginUseCase', () => {
  it('returns access token and user/org info on successful login', async () => {
    const { useCase, user, organization } = makeSut();

    const output = await useCase.execute({
      email: 'john@studio.com',
      password: 'secureP@ss123',
    });

    expect(output.accessToken).toBe('jwt-token-here');
    expect(output.user.email).toBe('john@studio.com');
    expect(output.organization.slug).toBe('cd-projekt-red');
    expect(output.role).toBe('ADMIN');
  });

  it('throws BadLoginError when email not found', async () => {
    const { useCase, userGateway } = makeSut();
    userGateway.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'bad@email.com', password: 'pass' }),
    ).rejects.toBeInstanceOf(BadLoginError);
  });

  it('throws BadLoginError when password is wrong', async () => {
    const { useCase, passwordHashService } = makeSut();
    passwordHashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'john@studio.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(BadLoginError);
  });

  it('signs JWT with correct payload', async () => {
    const { useCase, jwtTokenService, user, member, organization } = makeSut();

    await useCase.execute({
      email: 'john@studio.com',
      password: 'secureP@ss123',
    });

    expect(jwtTokenService.sign).toHaveBeenCalledWith({
      userId: user.id,
      memberId: member.id,
      organizationId: organization.id,
      role: 'ADMIN',
    });
  });
});