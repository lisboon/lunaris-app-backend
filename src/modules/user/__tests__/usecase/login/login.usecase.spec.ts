import LoginUseCase from '../../../usecase/login/login.usecase';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { User } from '../../../domain/user.entity';
import { Member } from '@/modules/member/domain/member.entity';
import { Organization } from '@/modules/organization/domain/organization.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const fakeUser = () =>
  User.create({
    email: 'hero@game.io',
    name: 'Hero',
    password: 'hashed_pw',
  });

const fakeMember = (userId: string) =>
  Member.create({
    userId,
    organizationId: '22222222-2222-4222-8222-222222222222',
    role: MemberRole.ADMIN,
  });

const fakeOrganization = () =>
  Organization.create({
    name: 'GameStudio',
    slug: 'gamestudio',
  });

const makeSut = ({
  user = null as User | null,
  member = null as Member | null,
  organization = null as Organization | null,
  passwordMatch = true,
  token = 'jwt.token.here',
} = {}) => {
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
    compare: jest.fn().mockResolvedValue(passwordMatch),
  };
  const jwtTokenService = {
    sign: jest.fn().mockReturnValue(token),
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
    userGateway,
    memberGateway,
    organizationGateway,
    passwordHashService,
    jwtTokenService,
  };
};

describe('LoginUseCase', () => {
  it('returns token and user/org info on success', async () => {
    const user = fakeUser();
    const member = fakeMember(user.id);
    const organization = fakeOrganization();

    const { useCase, jwtTokenService } = makeSut({
      user,
      member,
      organization,
      passwordMatch: true,
    });

    const result = await useCase.execute({
      email: 'hero@game.io',
      password: 'plain_pw',
    });

    expect(result.accessToken).toBe('jwt.token.here');
    expect(result.user).toMatchObject({ email: 'hero@game.io', name: 'Hero' });
    expect(result.organization).toMatchObject({ name: 'GameStudio' });
    expect(result.role).toBe(MemberRole.ADMIN);
    expect(jwtTokenService.sign).toHaveBeenCalledWith({
      userId: user.id,
      memberId: member.id,
      organizationId: organization.id,
      role: MemberRole.ADMIN,
    });
  });

  it('throws BadLoginError when user is not found', async () => {
    const { useCase } = makeSut({ user: null });

    await expect(
      useCase.execute({ email: 'ghost@game.io', password: 'pass' }),
    ).rejects.toBeInstanceOf(BadLoginError);
  });

  it('throws BadLoginError when password is wrong', async () => {
    const user = fakeUser();
    const { useCase } = makeSut({ user, passwordMatch: false });

    await expect(
      useCase.execute({ email: 'hero@game.io', password: 'wrong' }),
    ).rejects.toBeInstanceOf(BadLoginError);
  });

  it('throws NotFoundError when member is not found', async () => {
    const user = fakeUser();
    const { useCase } = makeSut({ user, member: null, passwordMatch: true });

    await expect(
      useCase.execute({ email: 'hero@game.io', password: 'plain_pw' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
