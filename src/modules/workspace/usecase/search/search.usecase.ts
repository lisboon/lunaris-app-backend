import { WorkspaceGateway } from '../../gateway/workspace.gateway';
import {
  SearchUseCaseInputDto,
  SearchUseCaseInterface,
  SearchUseCaseOutputDto,
} from './search.usecase.dto';

export default class SearchUseCase implements SearchUseCaseInterface {
  constructor(private readonly workspaceRepository: WorkspaceGateway) {}

  async execute(data: SearchUseCaseInputDto): Promise<SearchUseCaseOutputDto> {
    const { organizationId, name, active, sort, sortDir, page, perPage } = data;

    const result = await this.workspaceRepository.search({
      filter: { organizationId, name, active },
      sort,
      sortDir,
      page,
      perPage,
    });

    return {
      items: result.items.map((w) => w.toJSON()),
      total: result.total,
      currentPage: result.currentPage,
      perPage: result.perPage,
      lastPage: result.lastPage,
    };
  }
}
