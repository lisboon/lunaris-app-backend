import type {
  OrganizationApiKey as PrismaApiKeyRow,
  PrismaClient,
} from '@prisma/client';
import { ApiKey } from '../domain/engine.entity';
import { ApiKeyGateway } from '../gateway/engine.gateway';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';

export default class ApiKeyRepository implements ApiKeyGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(trx?: TransactionContext): PrismaClient {
    return (trx as PrismaClient) ?? this.prisma;
  }

  private toEntity(row: PrismaApiKeyRow): ApiKey {
    return new ApiKey({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      keyHash: row.keyHash,
      prefix: row.prefix,
      lastUsedAt: row.lastUsedAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const row = await this.prisma.organizationApiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string, organizationId: string): Promise<ApiKey | null> {
    const row = await this.prisma.organizationApiKey.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrganization(organizationId: string): Promise<ApiKey[]> {
    const rows = await this.prisma.organizationApiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async create(apiKey: ApiKey): Promise<void> {
    await this.prisma.organizationApiKey.create({
      data: {
        id: apiKey.id,
        organizationId: apiKey.organizationId,
        name: apiKey.name,
        keyHash: apiKey.keyHash,
        prefix: apiKey.prefix,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  }

  async update(apiKey: ApiKey): Promise<void> {
    await this.prisma.organizationApiKey.updateMany({
      where: { id: apiKey.id, organizationId: apiKey.organizationId },
      data: {
        revokedAt: apiKey.revokedAt,
        lastUsedAt: apiKey.lastUsedAt,
      },
    });
  }

  async revokeByOrganization(
    organizationId: string,
    trx?: TransactionContext,
  ): Promise<void> {
    const client = this.getClient(trx);
    const now = new Date();
    await client.organizationApiKey.updateMany({
      where: { organizationId, revokedAt: null },
      data: { revokedAt: now, updatedAt: now },
    });
  }
}
