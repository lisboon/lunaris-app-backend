import { Member } from '../domain/member.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export interface MemberGateway {
  findById(id: string, organizationId: string): Promise<Member | null>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<Member | null>;
  findByUserId(userId: string): Promise<Member | null>;
  findByOrganization(organizationId: string): Promise<Member[]>;
  create(member: Member, trx?: TransactionContext): Promise<void>;
  update(member: Member): Promise<void>;
  countAdmins(organizationId: string): Promise<number>;
}
