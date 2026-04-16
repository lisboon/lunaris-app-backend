import { createHash, randomBytes } from 'crypto';

export const API_KEY_PREFIX = 'lnr_live_';

export class ApiKeyHashService {
  generate(): { rawKey: string; keyHash: string; prefix: string } {
    const rawKey = `${API_KEY_PREFIX}${randomBytes(32).toString('hex')}`;
    const keyHash = this.hash(rawKey);
    const prefix = rawKey.substring(0, 12);
    return { rawKey, keyHash, prefix };
  }

  hash(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }
}
