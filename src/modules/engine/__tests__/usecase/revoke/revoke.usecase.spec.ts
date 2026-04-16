import RevokeUseCase from '../../../usecase/revoke/revoke.usecase';
import { ApiKey } from '../../../domain/engine.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeKey = () =>
  ApiKey.create({
    organizationId: orgId,
    name: 'Unreal Plugin',
    keyHash: 'a'.repeat(64),
    prefix: 'lnr_live_ab',
  });

const makeSut = (apiKey: ApiKey) => {
  const repository = { update: jest.fn().mockResolvedValue(undefined) };
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(apiKey) };
  const useCase = new RevokeUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository, findByIdUseCase };
};

describe('RevokeUseCase', () => {
  it('revokes an active key and persists via update', async () => {
    const key = makeKey();
    const { useCase, repository } = makeSut(key);
    await useCase.execute({ id: key.id, organizationId: orgId });
    expect(key.isRevoked()).toBe(true);
    expect(repository.update).toHaveBeenCalledWith(key);
  });

  it('throws EntityValidationError if already revoked', async () => {
    const key = makeKey();
    key.revoke();
    const { useCase, repository } = makeSut(key);
    await expect(
      useCase.execute({ id: key.id, organizationId: orgId }),
    ).rejects.toBeInstanceOf(EntityValidationError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
