import { createHash } from 'crypto';
import { EngineThrottlerGuard } from '../engine-throttler.guard';

const invokeTracker = (req: Record<string, any>): Promise<string> => {
  const instance = Object.create(EngineThrottlerGuard.prototype);
  return (EngineThrottlerGuard.prototype as any).getTracker.call(instance, req);
};

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

describe('EngineThrottlerGuard.getTracker', () => {
  it('tracks by SHA-256 of x-api-key when the header is present', async () => {
    const rawKey = 'lnr_live_aaaa';
    const tracker = await invokeTracker({ headers: { 'x-api-key': rawKey } });
    expect(tracker).toBe(sha256(rawKey));
  });

  it('returns distinct trackers for different api keys (studio isolation)', async () => {
    const a = await invokeTracker({ headers: { 'x-api-key': 'lnr_live_a' } });
    const b = await invokeTracker({ headers: { 'x-api-key': 'lnr_live_b' } });
    expect(a).not.toBe(b);
  });

  it('falls back to the parent tracker (IP) when x-api-key is absent', async () => {
    const tracker = await invokeTracker({
      headers: {},
      ip: '1.2.3.4',
      ips: [],
    });
    expect(tracker).toBe('1.2.3.4');
  });
});
