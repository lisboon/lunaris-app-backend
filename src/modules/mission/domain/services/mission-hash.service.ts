import { createHash } from 'crypto';
import { MissionContract } from '../../types/mission.types';

export class MissionHashService {
  compute(contract: MissionContract): string {
    return createHash('sha256')
      .update(JSON.stringify(contract))
      .digest('hex');
  }
}
