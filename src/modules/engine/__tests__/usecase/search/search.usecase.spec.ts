import SearchUseCase from '../../../usecase/search/search.usecase';
import { ApiKey } from '../../../domain/engine.entity';

const orgId = '11111111-1111-4111-8111-111111111111';

const makeKey = () =>
  ApiKey.create({
    organizationId: orgId,
    name: 'Key',
    keyHash: 'a'.repeat(64),
    prefix: 'lnr_live_ab',
  });

describe('SearchUseCase', () => {
  it('returns mapped summaries scoped by organization', async () => {
    const keys = [makeKey(), makeKey()];
    const repository = {
      findByOrganization: jest.fn().mockResolvedValue(keys),
    };
    const useCase = new SearchUseCase(repository as any);
    const out = await useCase.execute({ organizationId: orgId });
    expect(repository.findByOrganization).toHaveBeenCalledWith(orgId);
    expect(out.total).toBe(2);
    expect(out.items[0]).toHaveProperty('prefix');
    expect(out.items[0]).not.toHaveProperty('keyHash');
  });
});
