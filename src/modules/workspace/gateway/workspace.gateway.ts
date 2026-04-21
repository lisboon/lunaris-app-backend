import { SearchResult } from '@/modules/@shared/repository/search-result';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { Workspace } from '../domain/workspace.entity';
import { WorkspaceSearchParams } from './workspace.filter';

export interface WorkspaceGateway {
  findById(id: string, organizationId: string): Promise<Workspace | null>;
  findByName(name: string, organizationId: string): Promise<Workspace | null>;
  create(data: Workspace): Promise<void>;
  update(data: Workspace): Promise<void>;
  findAll(organizationId: string): Promise<Workspace[]>;
  search(params: WorkspaceSearchParams): Promise<SearchResult<Workspace>>;
  softDeleteByOrganization(
    organizationId: string,
    trx?: TransactionContext,
  ): Promise<void>;
}
