import { Inject, Injectable } from '@nestjs/common';
import MemberFacade from '@/modules/member/facade/member.facade';
import {
  FindByIdFacadeInputDto,
  ListByOrganizationFacadeInputDto,
  ChangeRoleFacadeInputDto,
  RemoveMemberFacadeInputDto,
} from '@/modules/member/facade/member.facade.dto';

@Injectable()
export class MemberService {
  @Inject(MemberFacade)
  private readonly memberFacade: MemberFacade;

  async findById(input: FindByIdFacadeInputDto) {
    return this.memberFacade.findById(input);
  }

  async listByOrganization(input: ListByOrganizationFacadeInputDto) {
    return this.memberFacade.listByOrganization(input);
  }

  async changeRole(input: ChangeRoleFacadeInputDto) {
    return this.memberFacade.changeRole(input);
  }

  async remove(input: RemoveMemberFacadeInputDto) {
    return this.memberFacade.remove(input);
  }
}
