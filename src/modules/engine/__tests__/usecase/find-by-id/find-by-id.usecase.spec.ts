import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { ApiKey } from '../../../domain/engine.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeKey = () =>
  ApiKey.create({
    organizationId: orgId,
    name: 'Unreal Plugin',
    keyHash: 'a'.repeat(64),
    prefix: 'lnr_live_ab',
  });

const makeSut = (apiKey: ApiKey | null) => {
  const repository = { findById: jest.fn().mockResolvedValue(apiKey) };
  const useCase = new FindByIdUseCase(repository as any);
  return { useCase, repository };
};

describe('FindByIdUseCase', () => {
  it('returns the api key', async () => {
    const key = makeKey();
    const { useCase, repository } = makeSut(key);
    const out = await useCase.execute({ id: key.id, organizationId: orgId });
    expect(out).toBe(key);
    expect(repository.findById).toHaveBeenCalledWith(key.id, orgId);
  });

  it('throws NotFoundError when missing', async () => {
    const { useCase } = makeSut(null);
    await expect(
      useCase.execute({ id: 'x', organizationId: orgId }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
