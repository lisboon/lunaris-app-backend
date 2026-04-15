import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';
import { MissionGateway } from '../../gateway/mission.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  PublishInputDto,
  PublishOutputDto,
  PublishUseCaseInterface,
} from './publish.usecase.dto';

export default class PublishUseCase implements PublishUseCaseInterface {
  constructor(
    private readonly missionRepository: MissionGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly eventDispatcher?: EventDispatcherInterface,
  ) {}

  async execute(input: PublishInputDto): Promise<PublishOutputDto> {
    const mission = await this.findByIdUseCase.execute({
      id: input.missionId,
      organizationId: input.organizationId,
    });

    const version = await this.missionRepository.findVersionByHash(
      input.missionId,
      input.organizationId,
      input.versionHash,
    );

    if (!version) {
      throw new NotFoundError(input.versionHash, { name: 'MissionVersion' });
    }

    if (!version.isValid) {
      throw new EntityValidationError([
        {
          field: 'versionHash',
          message:
            'Cannot publish a version with validation errors. Fix the graph and save it again.',
        },
      ]);
    }

    mission.publish(input.versionHash);
    await this.missionRepository.update(mission);

    if (this.eventDispatcher) {
      for (const event of mission.pullEvents()) {
        await this.eventDispatcher.dispatch(event);
      }
    }

    return {
      id: mission.id,
      name: mission.name,
      status: mission.status,
      activeHash: mission.activeHash!,
      updatedAt: mission.updatedAt,
    };
  }
}
