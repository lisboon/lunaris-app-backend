import { MemberGateway } from '../../gateway/member.gateway';
import {
  ListByOrganizationInputDto,
  ListByOrganizationOutputDto,
  ListByOrganizationUseCaseInterface,
} from './list-by-organization.usecase.dto';

export default class ListByOrganizationUseCase
  implements ListByOrganizationUseCaseInterface
{
  constructor(private readonly memberRepository: MemberGateway) {}

  async execute(
    input: ListByOrganizationInputDto,
  ): Promise<ListByOrganizationOutputDto> {
    const members = await this.memberRepository.findByOrganization(
      input.organizationId,
    );
    return members.map((m) => m.toJSON());
  }
}