import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';
import { Mission } from '../../domain/mission.entity';
import { MissionGateway } from '../../gateway/mission.gateway';
import {
  CreateUseCaseInputDto,
  CreateUseCaseInterface,
  CreateUseCaseOutputDto,
} from './create.usecase.dto';

export default class CreateUseCase implements CreateUseCaseInterface {
  constructor(
    private readonly missionRepository: MissionGateway,
    private readonly eventDispatcher?: EventDispatcherInterface,
  ) {}

  async execute(input: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto> {
    const existing = await this.missionRepository.findById(
      input.id,
      input.organizationId,
    );

    if (existing) {
      throw new EntityValidationError([
        {
          field: 'id',
          message: `Mission with id '${input.id}' already exists in this organization`,
        },
      ]);
    }

    const mission = Mission.create({
      id: input.id,
      name: input.name,
      description: input.description,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      authorId: input.authorId,
    });

    await this.missionRepository.create(mission);

    if (this.eventDispatcher) {
      for (const event of mission.pullEvents()) {
        await this.eventDispatcher.dispatch(event);
      }
    }

    return mission.toJSON();
  }
}
