import { MemberGateway } from '../../gateway/member.gateway';
import { Member } from '../../domain/member.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly memberGateway: MemberGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<Member> {
    const member = await this.memberGateway.findById(
      data.id,
      data.organizationId,
    );

    if (!member) {
      throw new NotFoundError(data.id, Member);
    }

    return member;
  }
}
