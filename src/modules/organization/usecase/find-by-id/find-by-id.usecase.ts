import { OrganizationGateway } from '../../gateway/organization.gateway';
import { Organization } from '../../domain/organization.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly organizationRepository: OrganizationGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<Organization> {
    const org = await this.organizationRepository.findById(data.id);

    if (!org) {
      throw new NotFoundError(data.id, Organization);
    }

    return org;
  }
}