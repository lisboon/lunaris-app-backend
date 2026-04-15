import prisma from '@/infra/database/prisma.instance';
import { EventDispatcherInterface } from '@/modules/@shared/domain/events/event-dispatcher.interface';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import CreateUseCase from '../usecase/create/create.usecase';
import UpdateUseCase from '../usecase/update/update.usecase';
import SaveVersionUseCase from '../usecase/save-version/save-version.usecase';
import PublishUseCase from '../usecase/publish/publish.usecase';
import ListVersionsUseCase from '../usecase/list-versions/list-versions.usecase';
import GetActiveUseCase from '../usecase/get-active/get-active.usecase';
import MissionFacade from '../facade/mission.facade';
import { MissionRepository } from '../repository/mission.repository';
import { MissionHashService } from '../domain/services/mission-hash.service';

export default class MissionFacadeFactory {
  static create(eventDispatcher?: EventDispatcherInterface): MissionFacade {
    const repository = new MissionRepository(prisma);
    const hashService = new MissionHashService();

    const findByIdUseCase = new FindByIdUseCase(repository);
    const createUseCase = new CreateUseCase(repository, eventDispatcher);
    const updateUseCase = new UpdateUseCase(repository, findByIdUseCase);
    const saveVersionUseCase = new SaveVersionUseCase(
      repository,
      findByIdUseCase,
      hashService,
    );
    const publishUseCase = new PublishUseCase(
      repository,
      findByIdUseCase,
      eventDispatcher,
    );
    const listVersionsUseCase = new ListVersionsUseCase(
      repository,
      findByIdUseCase,
    );
    const getActiveUseCase = new GetActiveUseCase(repository, findByIdUseCase);

    return new MissionFacade(
      findByIdUseCase,
      createUseCase,
      updateUseCase,
      saveVersionUseCase,
      publishUseCase,
      listVersionsUseCase,
      getActiveUseCase,
    );
  }
}
