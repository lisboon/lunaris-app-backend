import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Mission } from '../../domain/mission.entity';
import { MissionGateway } from '../../gateway/mission.gateway';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly missionRepository: MissionGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<Mission> {
    const mission = await this.missionRepository.findById(
      data.id,
      data.organizationId,
    );

    if (!mission) {
      throw new NotFoundError(data.id, Mission);
    }

    return mission;
  }
}
