import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'crypto';

@Injectable()
export class EngineThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const rawKey = req?.headers?.['x-api-key'];
    if (typeof rawKey === 'string' && rawKey.length > 0) {
      return createHash('sha256').update(rawKey).digest('hex');
    }
    return super.getTracker(req);
  }
}
