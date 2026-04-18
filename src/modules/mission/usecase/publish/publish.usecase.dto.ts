import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { MissionStatus } from '@/modules/@shared/domain/enums';

export class PublishInputDto {
  @ApiProperty({ description: 'Target mission id', example: 'qst_old_country' })
  @IsString({ message: 'The missionId must be text' })
  @IsNotEmpty({ message: 'The missionId is required' })
  missionId: string;

  @ApiProperty({
    description: 'Hash (SHA-256) of the mission version to publish',
  })
  @IsString({ message: 'The versionHash must be text' })
  @IsNotEmpty({ message: 'The versionHash is required' })
  @Length(64, 64, { message: 'The versionHash must be a 64-char SHA-256 hex' })
  versionHash: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export interface PublishOutputDto {
  id: string;
  name: string;
  status: MissionStatus;
  activeHash: string;
  updatedAt: Date;
}

export interface PublishUseCaseInterface
  extends BaseUseCase<PublishInputDto, PublishOutputDto> {
  execute(input: PublishInputDto): Promise<PublishOutputDto>;
}
