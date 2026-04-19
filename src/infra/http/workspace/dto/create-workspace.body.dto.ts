import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateWorkspaceBodyDto {
  @ApiProperty({
    description: 'Human-readable workspace name (e.g. "Cyberpunk Team")',
    example: "Assassin's Creed Team",
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'The name must be text' })
  @IsNotEmpty({ message: 'The name is required' })
  @Length(2, 100, { message: 'The name must be between 2 and 100 characters' })
  name!: string;
}
