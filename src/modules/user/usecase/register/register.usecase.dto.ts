import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { MemberRole } from '@/modules/@shared/domain/enums';

export class RegisterUseCaseInputDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @Length(2, 255, { message: 'Name must be between 2 and 255 characters' })
  name: string;

  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  password: string;

  @IsString({ message: 'Organization name must be text' })
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers and hyphens',
  })
  @Length(3, 63, { message: 'Slug must be between 3 and 63 characters' })
  organizationSlug: string;
}

export interface RegisterUseCaseOutputDto {
  user: { id: string; email: string; name: string };
  organization: { id: string; name: string; slug: string };
  member: { id: string; role: MemberRole };
}

export interface RegisterUseCaseInterface
  extends BaseUseCase<RegisterUseCaseInputDto, RegisterUseCaseOutputDto> {
  execute(data: RegisterUseCaseInputDto): Promise<RegisterUseCaseOutputDto>;
}
