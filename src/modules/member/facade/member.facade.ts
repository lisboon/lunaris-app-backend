import { FindByIdUseCaseInterface } from '../usecase/find-by-id/find-by-id.usecase.dto';
import { ListByOrganizationUseCaseInterface } from '../usecase/list-by-organization/list-by-organization.usecase.dto';
import { ChangeRoleUseCaseInterface } from '../usecase/change-role/change-role.usecase.dto';
import { RemoveMemberUseCaseInterface } from '../usecase/remove-member/remove-member.usecase.dto';
import {
  MemberFacadeInterface,
  FindByIdFacadeInputDto,
  FindByIdFacadeOutputDto,
  ListByOrganizationFacadeInputDto,
  ListByOrganizationFacadeOutputDto,
  ChangeRoleFacadeInputDto,
  RemoveMemberFacadeInputDto,
} from './member.facade.dto';

export default class MemberFacade implements MemberFacadeInterface {
  constructor(
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly listByOrganizationUseCase: ListByOrganizationUseCaseInterface,
    private readonly changeRoleUseCase: ChangeRoleUseCaseInterface,
    private readonly removeUseCase: RemoveMemberUseCaseInterface,
  ) {}

  async findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto> {
    const member = await this.findByIdUseCase.execute(data);
    return member.toJSON();
  }

  async listByOrganization(
    data: ListByOrganizationFacadeInputDto,
  ): Promise<ListByOrganizationFacadeOutputDto> {
    return this.listByOrganizationUseCase.execute(data);
  }

  async changeRole(data: ChangeRoleFacadeInputDto): Promise<void> {
    return this.changeRoleUseCase.execute(data);
  }

  async remove(data: RemoveMemberFacadeInputDto): Promise<void> {
    return this.removeUseCase.execute(data);
  }
}
