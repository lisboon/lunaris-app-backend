import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateWorkspaceBodyDto {
  @ApiPropertyOptional({
    description: 'New workspace name',
    example: 'Far Cry Team',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'The name must be text' })
  @Length(2, 100, { message: 'The name must be between 2 and 100 characters' })
  name?: string;
}
