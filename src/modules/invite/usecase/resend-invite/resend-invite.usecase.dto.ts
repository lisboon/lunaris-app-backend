import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsUUID } from 'class-validator';

export class ResendInviteUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export interface ResendInviteUseCaseInterface
  extends BaseUseCase<ResendInviteUseCaseInputDto, void> {
  execute(input: ResendInviteUseCaseInputDto): Promise<void>;
}
