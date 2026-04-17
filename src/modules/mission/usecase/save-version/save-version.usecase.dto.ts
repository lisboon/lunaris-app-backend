import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';
import {
  CanvasGraph,
  DAGValidationErrors,
  MissionContract,
} from '../../types/mission.types';

export class SaveVersionInputDto {
  @ApiProperty({ description: 'Target mission id', example: 'qst_old_country' })
  @IsString({ message: 'The missionId must be text' })
  @IsNotEmpty({ message: 'The missionId is required' })
  missionId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid author' })
  authorId: string;

  @ApiProperty({ description: 'Raw canvas graph (nodes + edges)' })
  @IsObject({ message: 'The graphData must be an object' })
  graphData: CanvasGraph;

  @ApiProperty({ description: 'Compiled runtime mission contract' })
  @IsObject({ message: 'The missionData must be an object' })
  missionData: MissionContract;
}

export interface SaveVersionOutputDto {
  id: string;
  missionId: string;
  hash: string;
  isValid: boolean;
  validationErrors: DAGValidationErrors | null;
  createdAt: Date;
}

export interface SaveVersionUseCaseInterface
  extends BaseUseCase<SaveVersionInputDto, SaveVersionOutputDto> {
  execute(input: SaveVersionInputDto): Promise<SaveVersionOutputDto>;
}