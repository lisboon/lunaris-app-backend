import { Organization } from '../domain/organization.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export interface OrganizationGateway {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  create(org: Organization, trx?: TransactionContext): Promise<void>;
  update(org: Organization, trx?: TransactionContext): Promise<void>;
}
