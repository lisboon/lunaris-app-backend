import BaseUseCase from '@/modules/@shared/usecase/base.usecase';
import { Member } from '../../domain/member.entity';

export interface FindByIdUseCaseInputDto {
  id: string;
  organizationId: string;
}

export interface FindByIdUseCaseInterface
  extends BaseUseCase<FindByIdUseCaseInputDto, Member> {
  execute(data: FindByIdUseCaseInputDto): Promise<Member>;
}
