import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length } from 'class-validator';

export class CreateApiKeyBodyDto {
  @ApiProperty({
    description: 'Display name of the API Key (shown in the dashboard)',
    example: 'Unreal Plugin - Production',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Invalid name' })
  @Length(2, 100, { message: 'Invalid name' })
  name!: string;

  @ApiPropertyOptional({
    description:
      'Expiration date (ISO 8601). If omitted, the key never expires.',
    example: '2026-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Invalid expiration date' })
  expiresAt?: Date | null;
}
