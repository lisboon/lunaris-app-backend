import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { MissionGateway } from '../../gateway/mission.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  GetActiveInputDto,
  GetActiveOutputDto,
  GetActiveUseCaseInterface,
} from './get-active.usecase.dto';

export default class GetActiveUseCase implements GetActiveUseCaseInterface {
  constructor(
    private readonly missionRepository: MissionGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: GetActiveInputDto): Promise<GetActiveOutputDto> {
    const mission = await this.findByIdUseCase.execute({
      id: input.missionId,
      organizationId: input.organizationId,
    });

    if (!mission.activeHash) {
      throw new NotFoundError(input.missionId, {
        name: 'MissionActiveVersion',
      });
    }

    const version = await this.missionRepository.findVersionByHash(
      input.missionId,
      input.organizationId,
      mission.activeHash,
    );

    if (!version) {
      throw new NotFoundError(mission.activeHash, { name: 'MissionVersion' });
    }

    return version.missionData;
  }
}
