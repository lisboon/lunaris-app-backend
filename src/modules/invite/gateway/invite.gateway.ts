import { Invite } from '../domain/invite.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export interface InviteGateway {
  findById(id: string, organizationId: string): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;
  findByEmailAndOrg(email: string, organizationId: string): Promise<Invite | null>;
  findByOrganization(organizationId: string): Promise<Invite[]>;
  create(invite: Invite, trx?: TransactionContext): Promise<void>;
  update(invite: Invite, trx?: TransactionContext): Promise<void>;
}
