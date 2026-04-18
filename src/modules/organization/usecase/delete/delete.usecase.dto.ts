import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { IsUUID } from 'class-validator';

export class DeleteUseCaseInputDto {
  @IsUUID('4', { message: 'Invalid id' })
  id: string;
}

export interface DeleteUseCaseInterface
  extends BaseUseCase<DeleteUseCaseInputDto, void> {
  execute(input: DeleteUseCaseInputDto): Promise<void>;
}
