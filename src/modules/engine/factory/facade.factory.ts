import prisma from '@/infra/database/prisma.instance';
import ApiKeyRepository from '../repository/engine.repository';
import { ApiKeyHashService } from '../domain/services/engine-hash.service';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import CreateUseCase from '../usecase/create/create.usecase';
import RevokeUseCase from '../usecase/revoke/revoke.usecase';
import SearchUseCase from '../usecase/search/search.usecase';
import ValidateKeyUseCase from '../usecase/validate-key/validate-key.usecase';
import ApiKeyFacade from '../facade/engine.facade';

export default class ApiKeyFacadeFactory {
  static create(): ApiKeyFacade {
    const repository = new ApiKeyRepository(prisma);
    const hashService = new ApiKeyHashService();

    const findByIdUseCase = new FindByIdUseCase(repository);
    const createUseCase = new CreateUseCase(repository, hashService);
    const revokeUseCase = new RevokeUseCase(repository, findByIdUseCase);
    const searchUseCase = new SearchUseCase(repository);
    const validateKeyUseCase = new ValidateKeyUseCase(repository, hashService);

    return new ApiKeyFacade(
      findByIdUseCase,
      createUseCase,
      revokeUseCase,
      searchUseCase,
      validateKeyUseCase,
    );
  }
}
