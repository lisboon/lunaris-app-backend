import { PrismaClient } from '@prisma/client';
import { UserGateway } from '../gateway/user.gateway';
import { User } from '../domain/user.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export default class UserRepository implements UserGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(trx?: TransactionContext): PrismaClient {
    return (trx as PrismaClient) ?? this.prisma;
  }

  private toEntity(data: any): User {
    return new User({
      id: data.id,
      email: data.email,
      name: data.name,
      password: data.password,
      avatarUrl: data.avatarUrl ?? undefined,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    });
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(user: User, trx?: TransactionContext): Promise<void> {
    const client = this.getClient(trx);
    await client.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        avatarUrl: user.avatarUrl,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        name: user.name,
        password: user.password,
        avatarUrl: user.avatarUrl,
        active: user.active,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
    });
  }
}
