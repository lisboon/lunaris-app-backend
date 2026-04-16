import { EMissionStatus } from '@prisma/client';
import {
  CanvasGraph,
  DAGValidationErrors,
  MissionContract,
} from '../types/mission.types';

export interface MissionDto {
  id: string;
  name: string;
  description: string | null;
  status: EMissionStatus;
  activeHash: string | null;
  organizationId: string;
  workspaceId: string;
  authorId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | undefined;
}

export interface FindByIdFacadeInputDto {
  id: string;
  organizationId: string;
}
export type FindByIdFacadeOutputDto = MissionDto;

export interface CreateFacadeInputDto {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  workspaceId: string;
  authorId: string;
}
export type CreateFacadeOutputDto = MissionDto;

export interface UpdateFacadeInputDto {
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
}

export interface SaveVersionFacadeInputDto {
  missionId: string;
  organizationId: string;
  authorId: string;
  graphData: CanvasGraph;
  missionData: MissionContract;
  isValid: boolean;
  validationErrors?: DAGValidationErrors | null;
}
export interface SaveVersionFacadeOutputDto {
  id: string;
  missionId: string;
  hash: string;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  createdAt: Date;
}

export interface PublishFacadeInputDto {
  missionId: string;
  organizationId: string;
  versionHash: string;
}
export interface PublishFacadeOutputDto {
  id: string;
  name: string;
  status: EMissionStatus;
  activeHash: string;
  updatedAt: Date;
}

export interface ListVersionsFacadeInputDto {
  missionId: string;
  organizationId: string;
  page?: number;
  perPage?: number;
}
export interface MissionVersionSummaryDto {
  id: string;
  missionId: string;
  hash: string;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  authorId: string;
  createdAt: Date;
}
export interface ListVersionsFacadeOutputDto {
  items: MissionVersionSummaryDto[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
}

export interface GetActiveFacadeInputDto {
  missionId: string;
  organizationId: string;
}
export type GetActiveFacadeOutputDto = MissionContract;

export interface MissionFacadeInterface {
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
  create(data: CreateFacadeInputDto): Promise<CreateFacadeOutputDto>;
  update(data: UpdateFacadeInputDto): Promise<void>;
  saveVersion(
    data: SaveVersionFacadeInputDto,
  ): Promise<SaveVersionFacadeOutputDto>;
  publish(data: PublishFacadeInputDto): Promise<PublishFacadeOutputDto>;
  listVersions(
    data: ListVersionsFacadeInputDto,
  ): Promise<ListVersionsFacadeOutputDto>;
  getActive(data: GetActiveFacadeInputDto): Promise<GetActiveFacadeOutputDto>;
}
