import type {
  Mission as PrismaMissionRow,
  MissionVersion as PrismaMissionVersionRow,
  PrismaClient,
  Prisma,
} from '@prisma/client';
import { Mission, MissionProps } from '../domain/mission.entity';
import {
  MissionGateway,
  MissionVersionPersistData,
  MissionVersionRecord,
  MissionVersionSummary,
} from '../gateway/mission.gateway';

import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { MissionStatus } from '@/modules/@shared/domain/enums';
import {
  CanvasGraph,
  DAGValidationErrors,
  MissionContract,
} from '../types/mission.types';

type PrismaJson = Prisma.JsonValue;

function fromPrismaJson<T>(value: PrismaJson | null | undefined): T {
  return value as unknown as T;
}

export class MissionRepository implements MissionGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomainEntity(prismaRow: PrismaMissionRow): Mission {
    return new Mission({
      id: prismaRow.id,
      name: prismaRow.name,
      description: prismaRow.description ?? undefined,
      status: prismaRow.status as MissionStatus,
      activeHash: prismaRow.activeHash ?? undefined,
      organizationId: prismaRow.organizationId,
      workspaceId: prismaRow.workspaceId,
      authorId: prismaRow.authorId,
      active: prismaRow.active,
      createdAt: prismaRow.createdAt,
      updatedAt: prismaRow.updatedAt,
      deletedAt: prismaRow.deletedAt ?? undefined,
    } satisfies MissionProps);
  }

  private toVersionRecord(
    prismaRow: PrismaMissionVersionRow,
  ): MissionVersionRecord {
    return {
      id: prismaRow.id,
      missionId: prismaRow.missionId,
      hash: prismaRow.hash,
      graphData: fromPrismaJson<CanvasGraph>(prismaRow.graphData),
      missionData: fromPrismaJson<MissionContract>(prismaRow.missionData),
      isValid: prismaRow.isValid,
      validationErrors: prismaRow.validationErrors
        ? fromPrismaJson<DAGValidationErrors>(prismaRow.validationErrors)
        : null,
      authorId: prismaRow.authorId,
      createdAt: prismaRow.createdAt,
    };
  }

  async findById(
    missionId: string,
    organizationId: string,
  ): Promise<Mission | null> {
    const prismaRow = await this.prisma.mission.findFirst({
      where: { id: missionId, organizationId, deletedAt: null },
    });

    if (!prismaRow) return null;
    return this.toDomainEntity(prismaRow);
  }

  async create(mission: Mission): Promise<void> {
    await this.prisma.mission.create({
      data: {
        id: mission.id,
        name: mission.name,
        description: mission.description,
        status: mission.status,
        activeHash: mission.activeHash,
        organizationId: mission.organizationId,
        workspaceId: mission.workspaceId,
        authorId: mission.authorId,
        active: mission.active,
        createdAt: mission.createdAt,
        updatedAt: mission.updatedAt,
      },
    });
  }

  async update(mission: Mission): Promise<void> {
    await this.prisma.mission.updateMany({
      where: { id: mission.id, organizationId: mission.organizationId },
      data: {
        name: mission.name,
        description: mission.description,
        status: mission.status,
        activeHash: mission.activeHash,
        active: mission.active,
        updatedAt: mission.updatedAt,
        deletedAt: mission.deletedAt,
      },
    });
  }

  async saveVersion(
    data: MissionVersionPersistData,
  ): Promise<MissionVersionRecord> {
    const mission = await this.prisma.mission.findFirst({
      where: {
        id: data.missionId,
        organizationId: data.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!mission) {
      throw new NotFoundError(data.missionId, Mission);
    }

    const prismaRow = await this.prisma.missionVersion.create({
      data: {
        missionId: data.missionId,
        hash: data.hash,
        graphData: data.graphData as unknown as Prisma.InputJsonValue,
        missionData: data.missionData as unknown as Prisma.InputJsonValue,
        isValid: data.isValid,
        validationErrors: (data.validationErrors ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        authorId: data.authorId,
      },
    });

    return this.toVersionRecord(prismaRow);
  }

  async findVersionsByMissionId(
    missionId: string,
    organizationId: string,
    page: number,
    perPage: number,
  ): Promise<{ items: MissionVersionSummary[]; total: number }> {
    const skip = (page - 1) * perPage;
    const where = {
      missionId,
      mission: { organizationId, deletedAt: null },
    } satisfies Prisma.MissionVersionWhereInput;

    const [rawItems, total] = await Promise.all([
      this.prisma.missionVersion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
        select: {
          id: true,
          missionId: true,
          hash: true,
          isValid: true,
          validationErrors: true,
          createdAt: true,
          authorId: true,
        },
      }),
      this.prisma.missionVersion.count({ where }),
    ]);

    const items: MissionVersionSummary[] = rawItems.map((row) => ({
      ...row,
      validationErrors: row.validationErrors
        ? fromPrismaJson<DAGValidationErrors>(row.validationErrors)
        : null,
    }));

    return { items, total };
  }

  async findVersionByHash(
    missionId: string,
    organizationId: string,
    hash: string,
  ): Promise<MissionVersionRecord | null> {
    const prismaRow = await this.prisma.missionVersion.findFirst({
      where: {
        missionId,
        hash,
        mission: { organizationId, deletedAt: null },
      },
    });

    if (!prismaRow) return null;
    return this.toVersionRecord(prismaRow);
  }
}
