export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface FindByIdFacadeInputDto {
  id: string;
}
export type FindByIdFacadeOutputDto = OrganizationDto;

export interface UpdateFacadeInputDto {
  id: string;
  name?: string;
  slug?: string;
}

export interface DeleteFacadeInputDto {
  id: string;
}

export interface OrganizationFacadeInterface {
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
  update(data: UpdateFacadeInputDto): Promise<void>;
  delete(data: DeleteFacadeInputDto): Promise<void>;
}
