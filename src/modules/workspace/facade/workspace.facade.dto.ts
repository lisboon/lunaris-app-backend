import { SortDirection } from '@/modules/@shared/repository/search-params';

export interface WorkspaceDto {
  id: string;
  name: string;
  organizationId: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface FindByIdFacadeInputDto {
  id: string;
  organizationId: string;
}
export type FindByIdFacadeOutputDto = WorkspaceDto;

export interface CreateFacadeInputDto {
  name: string;
  organizationId: string;
}
export type CreateFacadeOutputDto = WorkspaceDto;

export interface SearchFacadeInputDto {
  organizationId: string;
  name?: string;
  active?: boolean;
  sort?: string;
  sortDir?: SortDirection;
  page?: number;
  perPage?: number;
}

export interface SearchFacadeOutputDto {
  items: WorkspaceDto[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
}

export interface UpdateFacadeInputDto {
  id: string;
  organizationId: string;
  name?: string;
}

export interface DeleteFacadeInputDto {
  id: string;
  organizationId: string;
}

export interface WorkspaceFacadeInterface {
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
  create(data: CreateFacadeInputDto): Promise<CreateFacadeOutputDto>;
  search(data: SearchFacadeInputDto): Promise<SearchFacadeOutputDto>;
  update(data: UpdateFacadeInputDto): Promise<void>;
  delete(data: DeleteFacadeInputDto): Promise<void>;
}
