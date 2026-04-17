import { PrismaClient } from '@prisma/client';
import { InviteGateway } from '../gateway/invite.gateway';
import { Invite } from '../domain/invite.entity';
import { InviteStatus, MemberRole } from '@/modules/@shared/domain/enums';

export default class InviteRepository implements InviteGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(data: any): Invite {
    return new Invite({
      id: data.id,
      email: data.email,
      role: data.role as MemberRole,
      status: data.status as InviteStatus,
      token: data.token,
      organizationId: data.organizationId,
      invitedById: data.invitedById,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string, organizationId: string): Promise<Invite | null> {
    const row = await this.prisma.invite.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByToken(token: string): Promise<Invite | null> {
    const row = await this.prisma.invite.findFirst({
      where: { token },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByEmailAndOrg(
    email: string,
    organizationId: string,
  ): Promise<Invite | null> {
    const row = await this.prisma.invite.findFirst({
      where: { email, organizationId, status: 'PENDING' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrganization(organizationId: string): Promise<Invite[]> {
    const rows = await this.prisma.invite.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async create(invite: Invite): Promise<void> {
    await this.prisma.invite.create({
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        token: invite.token,
        organizationId: invite.organizationId,
        invitedById: invite.invitedById,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        updatedAt: invite.updatedAt,
      },
    });
  }

  async update(invite: Invite): Promise<void> {
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: invite.status,
        token: invite.token,
        expiresAt: invite.expiresAt,
        updatedAt: invite.updatedAt,
      },
    });
  }
}