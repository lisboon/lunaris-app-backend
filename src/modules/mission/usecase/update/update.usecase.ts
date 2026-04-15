import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import { MissionGateway } from '../../gateway/mission.gateway';
import {
  UpdateUseCaseInputDto,
  UpdateUseCaseInterface,
} from './update.usecase.dto';

export default class UpdateUseCase implements UpdateUseCaseInterface {
  constructor(
    private readonly missionRepository: MissionGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: UpdateUseCaseInputDto): Promise<void> {
    const mission = await this.findByIdUseCase.execute({
      id: input.id,
      organizationId: input.organizationId,
    });

    mission.updateMission({ name: input.name, description: input.description });

    await this.missionRepository.update(mission);
  }
}
