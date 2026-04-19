import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class PublishMissionBodyDto {
  @ApiProperty({
    description: 'Hash (SHA-256 hex, 64 chars) of the mission version to publish',
  })
  @IsString({ message: 'The versionHash must be text' })
  @IsNotEmpty({ message: 'The versionHash is required' })
  @Length(64, 64, { message: 'The versionHash must be a 64-char SHA-256 hex' })
  versionHash!: string;
}
