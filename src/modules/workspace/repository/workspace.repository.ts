import { PrismaClient } from '@prisma/client';
import { WorkspaceGateway } from '../gateway/workspace.gateway';
import { Workspace } from '../domain/workspace.entity';
import { WorkspaceSearchParams } from '../gateway/workspace.filter';
import WorkspaceQueryBuilder from './workspace.query.builder';
import { SearchResult } from '@/modules/@shared/repository/search-result';
import { SearchParams } from '@/modules/@shared/repository/search-params';

export default class WorkspaceRepository implements WorkspaceGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(data: any): Workspace {
    return new Workspace({
      id: data.id,
      name: data.name,
      organizationId: data.organizationId,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<Workspace | null> {
    const row = await this.prisma.workspace.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    name: string,
    organizationId: string,
  ): Promise<Workspace | null> {
    const row = await this.prisma.workspace.findFirst({
      where: { name, organizationId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(data: Workspace): Promise<void> {
    await this.prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        organizationId: data.organizationId,
        active: data.active,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async update(data: Workspace): Promise<void> {
    await this.prisma.workspace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        active: data.active,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  }

  async search(
    params: WorkspaceSearchParams,
  ): Promise<SearchResult<Workspace>> {
    const searchParams = new SearchParams({
      filter: params.filter,
      sort: params.sort,
      sortDir: params.sortDir,
      page: params.page,
      perPage: params.perPage,
    });

    const query = new WorkspaceQueryBuilder(
      searchParams.filter,
      { sort: searchParams.sort, sortDir: searchParams.sortDir },
      { page: searchParams.page, perPage: searchParams.perPage },
    ).build();

    const [items, count] = await Promise.all([
      this.prisma.workspace.findMany({ ...query }),
      this.prisma.workspace.count({
        where: query.where,
        take: undefined,
        skip: undefined,
      }),
    ]);

    return new SearchResult<Workspace>({
      items: items.map((item) => this.toEntity(item)),
      total: count,
      perPage: searchParams.perPage,
      currentPage: searchParams.page,
    });
  }

  async findAll(organizationId: string): Promise<Workspace[]> {
    const rows = await this.prisma.workspace.findMany({
      where: { organizationId, deletedAt: null },
    });
    return rows.map((row) => this.toEntity(row));
  }
}
