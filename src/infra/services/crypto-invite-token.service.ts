import { randomUUID } from 'crypto';
import { InviteTokenService } from '@/modules/@shared/domain/services/invite-token.service';

export class CryptoInviteTokenService implements InviteTokenService {
  generate(): string {
    return randomUUID();
  }
}
