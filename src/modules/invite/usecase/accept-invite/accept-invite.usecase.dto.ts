import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsOptional, IsString, Length } from 'class-validator';

export class AcceptInviteUseCaseInputDto {
  @IsString({ message: 'Token must be a string' })
  token: string;

  @IsString({ message: 'Name must be text' })
  @Length(2, 255, { message: 'Name must be between 2 and 255 characters' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Password must be a string' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @IsOptional()
  password?: string;
}

export interface AcceptInviteUseCaseOutputDto {
  userId: string;
  memberId: string;
  organizationId: string;
}

export interface AcceptInviteUseCaseInterface
  extends BaseUseCase<AcceptInviteUseCaseInputDto, AcceptInviteUseCaseOutputDto> {
  execute(
    data: AcceptInviteUseCaseInputDto,
  ): Promise<AcceptInviteUseCaseOutputDto>;
}
