import { Mission } from '../domain/mission.entity';
import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import {
  CanvasGraph,
  DAGValidationErrors,
  MissionContract,
} from '../types/mission.types';

export interface MissionVersionPersistData {
  missionId: string;
  organizationId: string;
  hash: string;
  graphData: CanvasGraph;
  missionData: MissionContract;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  authorId: string;
}

export interface MissionVersionRecord {
  id: string;
  missionId: string;
  hash: string;
  graphData: CanvasGraph;
  missionData: MissionContract;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  authorId: string;
  createdAt: Date;
}

export interface MissionVersionSummary {
  id: string;
  missionId: string;
  hash: string;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  authorId: string;
  createdAt: Date;
}

export interface MissionGateway {
  findById(missionId: string, organizationId: string): Promise<Mission | null>;
  create(mission: Mission): Promise<void>;
  update(mission: Mission): Promise<void>;
  saveVersion(data: MissionVersionPersistData): Promise<MissionVersionRecord>;
  findVersionsByMissionId(
    missionId: string,
    organizationId: string,
    page: number,
    perPage: number,
  ): Promise<{ items: MissionVersionSummary[]; total: number }>;
  findVersionByHash(
    missionId: string,
    organizationId: string,
    hash: string,
  ): Promise<MissionVersionRecord | null>;
  softDeleteByOrganization(
    organizationId: string,
    trx?: TransactionContext,
  ): Promise<void>;
}
