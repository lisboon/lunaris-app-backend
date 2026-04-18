import { PrismaClient } from '@prisma/client';
import {
  TransactionManager,
  TransactionContext,
} from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(fn: (trx: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => fn(tx));
  }
}
