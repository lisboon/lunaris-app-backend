import { MemberGateway } from '../../gateway/member.gateway';
import {
  ListByOrganizationUseCaseInputDto,
  ListByOrganizationUseCaseInterface,
  MemberSummaryDto,
} from './list-by-organization.usecase.dto';

export default class ListByOrganizationUseCase
  implements ListByOrganizationUseCaseInterface
{
  constructor(private readonly memberGateway: MemberGateway) {}

  async execute(
    data: ListByOrganizationUseCaseInputDto,
  ): Promise<MemberSummaryDto[]> {
    const members = await this.memberGateway.findByOrganization(
      data.organizationId,
    );

    return members.map((member) => member.toJSON());
  }
}
