import { User } from '../domain/user.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export interface UserGateway {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User, trx?: TransactionContext): Promise<void>;
  update(user: User): Promise<void>;
}