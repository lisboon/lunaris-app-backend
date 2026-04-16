import ApiKeyFacade from '../../facade/engine.facade';
import { ApiKey } from '../../domain/engine.entity';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeSut = () => {
  const apiKey = ApiKey.create({
    organizationId: orgId,
    name: 'Unreal',
    keyHash: 'a'.repeat(64),
    prefix: 'lnr_live_ab',
  });

  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(apiKey) };
  const createUseCase = {
    execute: jest.fn().mockResolvedValue({
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      rawKey: 'lnr_live_raw',
      expiresAt: null,
      createdAt: apiKey.createdAt,
    }),
  };
  const revokeUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
  const searchUseCase = {
    execute: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };
  const validateKeyUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue({ id: apiKey.id, organizationId: orgId }),
  };

  const facade = new ApiKeyFacade(
    findByIdUseCase as any,
    createUseCase as any,
    revokeUseCase as any,
    searchUseCase as any,
    validateKeyUseCase as any,
  );

  return {
    facade,
    apiKey,
    findByIdUseCase,
    createUseCase,
    revokeUseCase,
    searchUseCase,
    validateKeyUseCase,
  };
};

describe('ApiKeyFacade', () => {
  it('findById serializes to ApiKeyDto without keyHash', async () => {
    const { facade, apiKey, findByIdUseCase } = makeSut();
    const out = await facade.findById({
      id: apiKey.id,
      organizationId: orgId,
    });
    expect(findByIdUseCase.execute).toHaveBeenCalledWith({
      id: apiKey.id,
      organizationId: orgId,
    });
    expect(out).not.toHaveProperty('keyHash');
    expect(out.id).toBe(apiKey.id);
  });

  it('create delegates', async () => {
    const { facade, createUseCase } = makeSut();
    const out = await facade.create({ name: 'Key', organizationId: orgId });
    expect(createUseCase.execute).toHaveBeenCalled();
    expect(out.rawKey).toBe('lnr_live_raw');
  });

  it('revoke delegates', async () => {
    const { facade, revokeUseCase, apiKey } = makeSut();
    await facade.revoke({ id: apiKey.id, organizationId: orgId });
    expect(revokeUseCase.execute).toHaveBeenCalledWith({
      id: apiKey.id,
      organizationId: orgId,
    });
  });

  it('search delegates', async () => {
    const { facade, searchUseCase } = makeSut();
    const out = await facade.search({ organizationId: orgId });
    expect(searchUseCase.execute).toHaveBeenCalledWith({
      organizationId: orgId,
    });
    expect(out.total).toBe(0);
  });

  it('validateKey delegates', async () => {
    const { facade, validateKeyUseCase, apiKey } = makeSut();
    const out = await facade.validateKey({ rawKey: 'lnr_live_raw' });
    expect(validateKeyUseCase.execute).toHaveBeenCalledWith({
      rawKey: 'lnr_live_raw',
    });
    expect(out.organizationId).toBe(orgId);
    expect(out.id).toBe(apiKey.id);
  });
});
