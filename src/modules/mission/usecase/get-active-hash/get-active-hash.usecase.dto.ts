import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetActiveHashInputDto {
  @ApiProperty({ description: 'Target mission id', example: 'qst_old_country' })
  @IsString({ message: 'The missionId must be text' })
  @IsNotEmpty({ message: 'The missionId is required' })
  missionId: string;

  @ApiHideProperty()
  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export interface GetActiveHashOutputDto {
  hash: string;
}

export interface GetActiveHashUseCaseInterface extends BaseUseCase<
  GetActiveHashInputDto,
  GetActiveHashOutputDto
> {
  execute(input: GetActiveHashInputDto): Promise<GetActiveHashOutputDto>;
}
