import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MissionContract } from '../../types/mission.types';

export class GetActiveInputDto {
  @ApiProperty({ description: 'Target mission id', example: 'qst_old_country' })
  @IsString({ message: 'The missionId must be text' })
  @IsNotEmpty({ message: 'The missionId is required' })
  missionId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export type GetActiveOutputDto = MissionContract;

export interface GetActiveUseCaseInterface
  extends BaseUseCase<GetActiveInputDto, GetActiveOutputDto> {
  execute(input: GetActiveInputDto): Promise<GetActiveOutputDto>;
}
