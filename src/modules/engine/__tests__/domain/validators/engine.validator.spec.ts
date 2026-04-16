import ApiKeyValidatorFactory from '../../../domain/validators/engine.validator';
import { ApiKey } from '../../../domain/engine.entity';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';

const validOrgId = '11111111-1111-4111-8111-111111111111';

const buildKey = (
  overrides: Partial<{
    name: string;
    organizationId: string;
    keyHash: string;
    prefix: string;
  }> = {},
): ApiKey =>
  new ApiKey({
    name: 'Unreal Plugin',
    organizationId: validOrgId,
    keyHash: 'a'.repeat(64),
    prefix: 'lnr_live_ab',
    ...overrides,
  });

describe('ApiKeyValidator', () => {
  const validator = ApiKeyValidatorFactory.create();

  it('returns true for a valid api key', () => {
    const notification = new Notification();
    const ok = validator.validate(notification, buildKey(), ['create']);
    expect(ok).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  it.each([
    ['short name', { name: 'a' }, 'name'],
    ['non-uuid organization', { organizationId: 'not-uuid' }, 'organizationId'],
    ['short hash', { keyHash: 'abc' }, 'keyHash'],
    ['short prefix', { prefix: 'lnr' }, 'prefix'],
  ])('fails for %s', (_label, overrides, field) => {
    const notification = new Notification();
    const ok = validator.validate(notification, buildKey(overrides), [
      'create',
    ]);
    expect(ok).toBe(false);
    const json = notification.toJSON();
    expect(json.some((e) => e.field === field)).toBe(true);
  });
});
