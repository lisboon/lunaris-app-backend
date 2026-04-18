import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { User } from '../../domain/user.entity';

export interface FindByIdUseCaseInputDto {
  id: string;
}

export interface FindByIdUseCaseInterface
  extends BaseUseCase<FindByIdUseCaseInputDto, User> {
  execute(data: FindByIdUseCaseInputDto): Promise<User>;
}