import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateOrganizationBodyDto {
  @IsString({ message: 'Name must be text' })
  @IsOptional()
  name?: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers and hyphens',
  })
  @Length(3, 63, { message: 'Slug must be between 3 and 63 characters' })
  @IsOptional()
  slug?: string;
}
