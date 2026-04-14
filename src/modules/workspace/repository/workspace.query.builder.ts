import PrismaQueryBuilder from '@/modules/@shared/repository/prisma-query-builder';

export default class WorkspaceQueryBuilder extends PrismaQueryBuilder {
  subItems: string[] = [];
  whereFields: string[] = ['organizationId', 'active'];
  inFields: string[] = [];
  orFields: string[] = [];
  searchFields: string[] = ['name'];
  sortableFields: string[] = ['name', 'createdAt', 'updatedAt'];
  relationFields: string[] = [];
  relationFilter = undefined;
  include = undefined;
}
