import { ApiKey } from '../../domain/engine.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const orgId = '11111111-1111-4111-8111-111111111111';
const validHash = 'a'.repeat(64);
const validPrefix = 'lnr_live_ab';

const baseProps = () => ({
  organizationId: orgId,
  name: 'Unreal Plugin Prod',
  keyHash: validHash,
  prefix: validPrefix,
});

describe('ApiKey entity', () => {
  it('creates a valid active key', () => {
    const key = ApiKey.create(baseProps());
    expect(key.id).toBeDefined();
    expect(key.active).toBe(true);
    expect(key.revokedAt).toBeNull();
    expect(key.isRevoked()).toBe(false);
    expect(key.isExpired()).toBe(false);
  });

  it('throws EntityValidationError for short name', () => {
    expect(() => ApiKey.create({ ...baseProps(), name: 'a' })).toThrow(
      EntityValidationError,
    );
  });

  it('throws for invalid organization UUID', () => {
    expect(() =>
      ApiKey.create({ ...baseProps(), organizationId: 'not-uuid' }),
    ).toThrow(EntityValidationError);
  });

  it('throws for invalid keyHash shape', () => {
    expect(() => ApiKey.create({ ...baseProps(), keyHash: 'short' })).toThrow(
      EntityValidationError,
    );
  });

  it('revoke sets revokedAt and deactivates', () => {
    const key = ApiKey.create(baseProps());
    key.revoke();
    expect(key.revokedAt).toBeInstanceOf(Date);
    expect(key.active).toBe(false);
    expect(key.isRevoked()).toBe(true);
  });

  it('isExpired true when expiresAt is past', () => {
    const past = new Date(Date.now() - 1000);
    const key = ApiKey.create({ ...baseProps(), expiresAt: past });
    expect(key.isExpired()).toBe(true);
  });

  it('touchLastUsed updates lastUsedAt', () => {
    const key = ApiKey.create(baseProps());
    const at = new Date('2026-01-01T00:00:00Z');
    key.touchLastUsed(at);
    expect(key.lastUsedAt).toEqual(at);
  });
});
