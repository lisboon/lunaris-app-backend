import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsUUID } from 'class-validator';

export class CancelInviteUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export interface CancelInviteUseCaseInterface
  extends BaseUseCase<CancelInviteUseCaseInputDto, void> {
  execute(input: CancelInviteUseCaseInputDto): Promise<void>;
}
