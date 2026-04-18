import { PrismaClient } from '@prisma/client';
import { OrganizationGateway } from '../gateway/organization.gateway';
import { Organization } from '../domain/organization.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export default class OrganizationRepository implements OrganizationGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(trx?: TransactionContext): PrismaClient {
    return (trx as PrismaClient) ?? this.prisma;
  }

  private toEntity(data: any): Organization {
    return new Organization({
      id: data.id,
      name: data.name,
      slug: data.slug,
      avatarUrl: data.avatarUrl ?? undefined,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    });
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findFirst({
      where: { slug, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(org: Organization, trx?: TransactionContext): Promise<void> {
    const client = this.getClient(trx);
    await client.organization.create({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        avatarUrl: org.avatarUrl,
        active: org.active,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
    });
  }

  async update(org: Organization): Promise<void> {
    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        name: org.name,
        slug: org.slug,
        avatarUrl: org.avatarUrl,
        active: org.active,
        updatedAt: org.updatedAt,
        deletedAt: org.deletedAt,
      },
    });
  }
}
