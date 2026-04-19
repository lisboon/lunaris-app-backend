import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import {
  CanvasGraph,
  MissionContract,
} from '@/modules/mission/types/mission.types';

export class SaveVersionBodyDto {
  @ApiProperty({
    description: 'Raw canvas graph (React Flow nodes + edges)',
  })
  @IsObject({ message: 'The graphData must be an object' })
  graphData!: CanvasGraph;

  @ApiProperty({
    description: 'Compiled runtime mission contract consumed by the UE5 plugin',
  })
  @IsObject({ message: 'The missionData must be an object' })
  missionData!: MissionContract;
}
