import {
  ApiKeyHashService,
  API_KEY_PREFIX,
} from '../../../domain/services/engine-hash.service';

describe('ApiKeyHashService', () => {
  const sut = new ApiKeyHashService();

  it('generates a raw key with lnr_live_ prefix', () => {
    const { rawKey, keyHash, prefix } = sut.generate();
    expect(rawKey.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(rawKey.startsWith('lnr_live_')).toBe(true);
    expect(prefix).toBe(rawKey.substring(0, 12));
    expect(keyHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hash is deterministic', () => {
    const { rawKey, keyHash } = sut.generate();
    expect(sut.hash(rawKey)).toBe(keyHash);
  });

  it('generates unique keys per call', () => {
    const a = sut.generate();
    const b = sut.generate();
    expect(a.rawKey).not.toBe(b.rawKey);
    expect(a.keyHash).not.toBe(b.keyHash);
  });
});
