import { OrganizationGateway } from '../../gateway/organization.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import {
  UpdateUseCaseInputDto,
  UpdateUseCaseInterface,
} from './update.usecase.dto';

export default class UpdateUseCase implements UpdateUseCaseInterface {
  constructor(
    private readonly organizationGateway: OrganizationGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: UpdateUseCaseInputDto): Promise<void> {
    const organization = await this.findByIdUseCase.execute({ id: input.id });

    if (input.slug && input.slug !== organization.slug) {
      const existing = await this.organizationGateway.findBySlug(input.slug);
      if (existing) {
        throw new EntityValidationError([
          { field: 'slug', message: 'Slug already in use' },
        ]);
      }
    }

    organization.updateOrganization(input);

    await this.organizationGateway.update(organization);
  }
}
