import { MemberGateway } from '../../gateway/member.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole } from '@/modules/@shared/domain/enums';
import {
  ChangeRoleUseCaseInputDto,
  ChangeRoleUseCaseInterface,
} from './change-role.usecase.dto';

export default class ChangeRoleUseCase implements ChangeRoleUseCaseInterface {
  constructor(
    private readonly memberGateway: MemberGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: ChangeRoleUseCaseInputDto): Promise<void> {
    const member = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    if (
      member.role === MemberRole.ADMIN &&
      input.role !== MemberRole.ADMIN
    ) {
      const adminCount = await this.memberGateway.countAdmins(
        input.organizationId,
      );
      if (adminCount <= 1) {
        throw new ForbiddenError('Cannot demote the last admin');
      }
    }

    member.changeRole(input.role);

    await this.memberGateway.update(member);
  }
}
