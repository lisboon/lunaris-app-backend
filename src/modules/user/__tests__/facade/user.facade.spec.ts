import UserFacade from '../../facade/user.facade';
import { User } from '../../domain/user.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';

const makeSut = () => {
  const user = User.create({
    email: 'john@example.com',
    name: 'John Doe',
    password: 'hashedpassword',
  });

  const registerOutput = {
    user: { id: user.id, email: user.email, name: user.name },
    organization: { id: 'org-id', name: 'Acme', slug: 'acme' },
    member: { id: 'member-id', role: MemberRole.ADMIN },
  };

  const loginOutput = {
    accessToken: 'token-abc',
    user: { id: user.id, email: user.email, name: user.name },
    organization: { id: 'org-id', name: 'Acme', slug: 'acme' },
    role: MemberRole.ADMIN,
  };

  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(user) };
  const registerUseCase = { execute: jest.fn().mockResolvedValue(registerOutput) };
  const loginUseCase = { execute: jest.fn().mockResolvedValue(loginOutput) };

  const facade = new UserFacade(
    findByIdUseCase as any,
    registerUseCase as any,
    loginUseCase as any,
  );

  return {
    facade,
    user,
    registerOutput,
    loginOutput,
    findByIdUseCase,
    registerUseCase,
    loginUseCase,
  };
};

describe('UserFacade', () => {
  it('register delegates to use case and returns its output', async () => {
    const { facade, registerOutput, registerUseCase } = makeSut();
    const input = {
      email: 'john@example.com',
      name: 'John Doe',
      password: 'secret123',
      organizationName: 'Acme',
      organizationSlug: 'acme',
    };

    const output = await facade.register(input);

    expect(registerUseCase.execute).toHaveBeenCalledWith(input);
    expect(output).toEqual(registerOutput);
  });

  it('login delegates to use case and returns its output', async () => {
    const { facade, loginOutput, loginUseCase } = makeSut();
    const input = { email: 'john@example.com', password: 'secret123' };

    const output = await facade.login(input);

    expect(loginUseCase.execute).toHaveBeenCalledWith(input);
    expect(output).toEqual(loginOutput);
  });

  it('findById delegates to use case and serializes the entity via toJSON', async () => {
    const { facade, user, findByIdUseCase } = makeSut();

    const output = await facade.findById({ id: user.id });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({ id: user.id });
    expect(output).toEqual(user.toJSON());
    expect(output).not.toBe(user);
  });
});
