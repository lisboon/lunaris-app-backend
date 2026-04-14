import prisma from '@/infra/database/prisma.instance';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import CreateUseCase from '../usecase/create/create.usecase';
import SearchUseCase from '../usecase/search/search.usecase';
import UpdateUseCase from '../usecase/update/update.usecase';
import DeleteUseCase from '../usecase/delete/delete.usecase';
import WorkspaceFacade from '../facade/workspace.facade';
import WorkspaceRepository from '../repository/workspace.repository';

export default class WorkspaceFacadeFactory {
  static create() {
    const repository = new WorkspaceRepository(prisma);

    const findByIdUseCase = new FindByIdUseCase(repository);
    const createUseCase = new CreateUseCase(repository);
    const searchUseCase = new SearchUseCase(repository);
    const updateUseCase = new UpdateUseCase(repository, findByIdUseCase);
    const deleteUseCase = new DeleteUseCase(repository, findByIdUseCase);

    return new WorkspaceFacade(
      findByIdUseCase,
      createUseCase,
      searchUseCase,
      updateUseCase,
      deleteUseCase,
    );
  }
}
