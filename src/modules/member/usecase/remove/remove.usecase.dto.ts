import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsUUID } from 'class-validator';

export class RemoveMemberInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;

  @IsUUID('4', { message: 'Invalid organization' })
  organizationId: string;
}

export interface RemoveMemberUseCaseInterface
  extends BaseUseCase<RemoveMemberInputDto, void> {
  execute(input: RemoveMemberInputDto): Promise<void>;
}