export type TransactionContext = unknown;

export interface TransactionManager {
  execute<T>(fn: (trx: TransactionContext) => Promise<T>): Promise<T>;
}
