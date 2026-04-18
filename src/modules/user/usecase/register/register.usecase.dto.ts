import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterInputDto {
  @ApiProperty({ example: 'john@studio.com' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'The name must be text' })
  @Length(2, 255, { message: 'Name must be between 2 and 255 characters' })
  name: string;

  @ApiProperty({ example: 'secureP@ss123' })
  @IsString({ message: 'The password must be text' })
  @Length(8, 128, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'CD Projekt Red' })
  @IsString({ message: 'Organization name must be text' })
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName: string;

  @ApiProperty({ example: 'cd-projekt-red' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  @Length(3, 63, { message: 'Slug must be between 3 and 63 characters' })
  organizationSlug: string;
}

export interface RegisterOutputDto {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  member: {
    id: string;
    role: string;
  };
}

export interface RegisterUseCaseInterface
  extends BaseUseCase<RegisterInputDto, RegisterOutputDto> {
  execute(input: RegisterInputDto): Promise<RegisterOutputDto>;
}