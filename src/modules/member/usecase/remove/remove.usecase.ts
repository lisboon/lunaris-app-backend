import { MemberGateway } from '../../gateway/member.gateway';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  RemoveMemberInputDto,
  RemoveMemberUseCaseInterface,
} from './remove.usecase.dto';

export default class RemoveMemberUseCase
  implements RemoveMemberUseCaseInterface
{
  constructor(
    private readonly memberRepository: MemberGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: RemoveMemberInputDto): Promise<void> {
    const member = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    if (member.role === MemberRole.ADMIN) {
      const adminCount = await this.memberRepository.countAdmins(
        input.organizationId,
      );
      if (adminCount <= 1) {
        throw new ForbiddenError('Cannot remove the last admin');
      }
    }

    member.delete();
    await this.memberRepository.update(member);
  }
}