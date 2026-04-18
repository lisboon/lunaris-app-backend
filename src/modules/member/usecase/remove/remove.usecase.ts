import { MemberGateway } from '../../gateway/member.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole } from '@/modules/@shared/domain/enums';
import {
  RemoveMemberUseCaseInputDto,
  RemoveMemberUseCaseInterface,
} from './remove.usecase.dto';

export default class RemoveMemberUseCase
  implements RemoveMemberUseCaseInterface
{
  constructor(
    private readonly memberGateway: MemberGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: RemoveMemberUseCaseInputDto): Promise<void> {
    const member = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    if (member.role === MemberRole.ADMIN) {
      const adminCount = await this.memberGateway.countAdmins(
        input.organizationId,
      );
      if (adminCount <= 1) {
        throw new ForbiddenError('Cannot remove the last admin');
      }
    }

    member.delete();

    await this.memberGateway.update(member);
  }
}
