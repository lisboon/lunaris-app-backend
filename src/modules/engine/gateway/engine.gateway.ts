import { ApiKey } from '../domain/engine.entity';

export interface ApiKeyGateway {
  findByHash(keyHash: string): Promise<ApiKey | null>;
  findById(id: string, organizationId: string): Promise<ApiKey | null>;
  findByOrganization(organizationId: string): Promise<ApiKey[]>;
  create(apiKey: ApiKey): Promise<void>;
  update(apiKey: ApiKey): Promise<void>;
}
