import { ApiKey } from '../domain/engine.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export interface ApiKeyGateway {
  findByHash(keyHash: string): Promise<ApiKey | null>;
  findById(id: string, organizationId: string): Promise<ApiKey | null>;
  findByOrganization(organizationId: string): Promise<ApiKey[]>;
  create(apiKey: ApiKey): Promise<void>;
  update(apiKey: ApiKey): Promise<void>;
  recordUsage(apiKey: ApiKey): Promise<void>;
  revokeByOrganization(
    organizationId: string,
    trx?: TransactionContext,
  ): Promise<void>;
}
