import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginInputDto {
  @ApiProperty({ example: 'john@studio.com' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'secureP@ss123' })
  @IsString({ message: 'The password must be text' })
  @Length(1, 128, { message: 'Password is required' })
  password: string;
}

export interface LoginOutputDto {
  accessToken: string;
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
  role: string;
}

export interface LoginUseCaseInterface
  extends BaseUseCase<LoginInputDto, LoginOutputDto> {
  execute(input: LoginInputDto): Promise<LoginOutputDto>;
}
