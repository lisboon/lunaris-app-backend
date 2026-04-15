import { SearchResult } from '@/modules/@shared/repository/search-result';
import { MissionGateway } from '../../gateway/mission.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  ListVersionsInputDto,
  ListVersionsOutputDto,
  ListVersionsUseCaseInterface,
  MissionVersionSummaryDto,
} from './list-versions.usecase.dto';

export default class ListVersionsUseCase
  implements ListVersionsUseCaseInterface
{
  constructor(
    private readonly missionRepository: MissionGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: ListVersionsInputDto): Promise<ListVersionsOutputDto> {
    const mission = await this.findByIdUseCase.execute({
      id: input.missionId,
      organizationId: input.organizationId,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const result = await this.missionRepository.findVersionsByMissionId(
      mission.id,
      input.organizationId,
      page,
      perPage,
    );

    return new SearchResult<MissionVersionSummaryDto>({
      items: result.items,
      total: result.total,
      currentPage: page,
      perPage,
    });
  }
}
