import ValidateKeyUseCase from '../../../usecase/validate-key/validate-key.usecase';
import { ApiKey } from '../../../domain/engine.entity';
import { ApiKeyHashService } from '../../../domain/services/engine-hash.service';
import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = (apiKey: ApiKey | null) => {
  const hashService = new ApiKeyHashService();
  const repository = {
    findByHash: jest.fn().mockResolvedValue(apiKey),
    recordUsage: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new ValidateKeyUseCase(repository as any, hashService);
  return { useCase, repository, hashService };
};

describe('ValidateKeyUseCase', () => {
  it('returns id + organizationId when key is valid', async () => {
    const hashService = new ApiKeyHashService();
    const { rawKey, keyHash, prefix } = hashService.generate();
    const apiKey = ApiKey.create({
      organizationId: orgId,
      name: 'Unreal',
      keyHash,
      prefix,
    });
    const { useCase, repository } = makeSut(apiKey);
    const out = await useCase.execute({ rawKey });
    expect(out.organizationId).toBe(orgId);
    expect(out.id).toBe(apiKey.id);
    expect(repository.findByHash).toHaveBeenCalledWith(keyHash);
  });

  it('throws UnauthorizedError when the hash does not match any key', async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({ rawKey: 'lnr_live_unknown' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws when key is revoked', async () => {
    const apiKey = ApiKey.create({
      organizationId: orgId,
      name: 'Key',
      keyHash: 'a'.repeat(64),
      prefix: 'lnr_live_ab',
    });
    apiKey.revoke();
    const { useCase } = makeSut(apiKey);
    await expect(
      useCase.execute({ rawKey: 'lnr_live_anything' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('delegates lastUsedAt persistence to the repository via recordUsage', async () => {
    const hashService = new ApiKeyHashService();
    const { rawKey, keyHash, prefix } = hashService.generate();
    const apiKey = ApiKey.create({
      organizationId: orgId,
      name: 'Unreal',
      keyHash,
      prefix,
    });
    const { useCase, repository } = makeSut(apiKey);
    await useCase.execute({ rawKey });
    expect(repository.recordUsage).toHaveBeenCalledTimes(1);
    expect(repository.recordUsage).toHaveBeenCalledWith(apiKey);
  });

  it('does not call recordUsage when the key is invalid', async () => {
    const { useCase, repository } = makeSut(null);
    await expect(useCase.execute({ rawKey: 'lnr_live_x' })).rejects.toThrow();
    expect(repository.recordUsage).not.toHaveBeenCalled();
  });
});
