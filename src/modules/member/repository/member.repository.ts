import { PrismaClient } from '@prisma/client';
import { MemberGateway } from '../gateway/member.gateway';
import { Member } from '../domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export default class MemberRepository implements MemberGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(trx?: TransactionContext): PrismaClient {
    return (trx as PrismaClient) ?? this.prisma;
  }

  private toEntity(data: any): Member {
    return new Member({
      id: data.id,
      userId: data.userId,
      organizationId: data.organizationId,
      role: data.role as MemberRole,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    });
  }

  async findById(id: string, organizationId: string): Promise<Member | null> {
    const row = await this.prisma.member.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<Member | null> {
  const row = await this.prisma.member.findFirst({
    where: { userId, active: true, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return row ? this.toEntity(row) : null;
}

  async findByUserAndOrg(
    userId: string,
    organizationId: string,
  ): Promise<Member | null> {
    const row = await this.prisma.member.findFirst({
      where: { userId, organizationId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrganization(organizationId: string): Promise<Member[]> {
    const rows = await this.prisma.member.findMany({
      where: { organizationId, deletedAt: null },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async create(member: Member, trx?: TransactionContext): Promise<void> {
    const client = this.getClient(trx);
    await client.member.create({
      data: {
        id: member.id,
        userId: member.userId,
        organizationId: member.organizationId,
        role: member.role,
        active: member.active,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      },
    });
  }

  async update(member: Member): Promise<void> {
    await this.prisma.member.updateMany({
      where: { id: member.id, organizationId: member.organizationId },
      data: {
        role: member.role,
        active: member.active,
        updatedAt: member.updatedAt,
        deletedAt: member.deletedAt,
      },
    });
  }

  async countAdmins(organizationId: string): Promise<number> {
    return this.prisma.member.count({
      where: {
        organizationId,
        role: 'ADMIN',
        active: true,
        deletedAt: null,
      },
    });
  }
}