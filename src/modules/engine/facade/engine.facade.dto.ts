export interface ApiKeyDto {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeySummaryDto {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface FindByIdFacadeInputDto {
  id: string;
  organizationId: string;
}

export type FindByIdFacadeOutputDto = ApiKeyDto;

export interface CreateFacadeInputDto {
  name: string;
  organizationId: string;
  expiresAt?: Date | null;
}

export interface CreateFacadeOutputDto {
  id: string;
  name: string;
  prefix: string;
  rawKey: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface RevokeFacadeInputDto {
  id: string;
  organizationId: string;
}

export interface SearchFacadeInputDto {
  organizationId: string;
}

export interface SearchFacadeOutputDto {
  items: ApiKeySummaryDto[];
  total: number;
}

export interface ValidateKeyFacadeInputDto {
  rawKey: string;
}

export interface ValidateKeyFacadeOutputDto {
  id: string;
  organizationId: string;
}

export interface ApiKeyFacadeInterface {
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
  create(data: CreateFacadeInputDto): Promise<CreateFacadeOutputDto>;
  revoke(data: RevokeFacadeInputDto): Promise<void>;
  search(data: SearchFacadeInputDto): Promise<SearchFacadeOutputDto>;
  validateKey(
    data: ValidateKeyFacadeInputDto,
  ): Promise<ValidateKeyFacadeOutputDto>;
}
