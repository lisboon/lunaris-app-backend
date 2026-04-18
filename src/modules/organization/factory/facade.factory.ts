import prisma from '@/infra/database/prisma.instance';
import OrganizationRepository from '../repository/organization.repository';
import FindByIdUseCase from '../usecase/find-by-id/find-by-id.usecase';
import UpdateUseCase from '../usecase/update/update.usecase';
import DeleteUseCase from '../usecase/delete/delete.usecase';
import OrganizationFacade from '../facade/organization.facade';

export default class OrganizationFacadeFactory {
  static create() {
    const organizationRepository = new OrganizationRepository(prisma);

    const findByIdUseCase = new FindByIdUseCase(organizationRepository);
    const updateUseCase = new UpdateUseCase(organizationRepository, findByIdUseCase);
    const deleteUseCase = new DeleteUseCase(organizationRepository, findByIdUseCase);

    return new OrganizationFacade(findByIdUseCase, updateUseCase, deleteUseCase);
  }
}
