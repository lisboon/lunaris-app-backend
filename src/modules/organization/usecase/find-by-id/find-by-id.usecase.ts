import { OrganizationGateway } from '../../gateway/organization.gateway';
import { Organization } from '../../domain/organization.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly organizationGateway: OrganizationGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<Organization> {
    const organization = await this.organizationGateway.findById(data.id);

    if (!organization) {
      throw new NotFoundError(data.id, Organization);
    }

    return organization;
  }
}
