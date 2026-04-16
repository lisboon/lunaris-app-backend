import CreateUseCase from '../../../usecase/create/create.usecase';
import { ApiKeyHashService } from '../../../domain/services/engine-hash.service';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = () => {
  const repository = { create: jest.fn().mockResolvedValue(undefined) };
  const hashService = new ApiKeyHashService();
  const useCase = new CreateUseCase(repository as any, hashService);
  return { useCase, repository, hashService };
};

describe('CreateUseCase', () => {
  it('creates an ApiKey, persists, and returns the raw key exactly once', async () => {
    const { useCase, repository } = makeSut();
    const out = await useCase.execute({
      organizationId: orgId,
      name: 'Unreal Plugin Prod',
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(out.rawKey.startsWith('lnr_live_')).toBe(true);
    expect(out.prefix).toBe(out.rawKey.substring(0, 12));
    expect(out.id).toBeDefined();
  });

  it('rejects invalid name through the entity validation', async () => {
    const { useCase, repository } = makeSut();
    await expect(
      useCase.execute({ organizationId: orgId, name: 'a' }),
    ).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('accepts an optional expiresAt', async () => {
    const { useCase } = makeSut();
    const expires = new Date('2030-01-01');
    const out = await useCase.execute({
      organizationId: orgId,
      name: 'Key',
      expiresAt: expires,
    });
    expect(out.expiresAt).toEqual(expires);
  });
});
