import { SortDirection } from '@/modules/@shared/repository/search-params';

export interface WorkspaceFilter {
  organizationId: string;
  name?: string;
  active?: boolean;
}

export interface WorkspaceSearchParams {
  filter: WorkspaceFilter;
  sort?: string;
  sortDir?: SortDirection;
  page?: number;
  perPage?: number;
}
