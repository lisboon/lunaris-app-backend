// src/modules/organization/usecase/update/update.usecase.ts
import { OrganizationGateway } from '../../gateway/organization.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import {
  UpdateUseCaseInputDto,
  UpdateUseCaseInterface,
} from './update.usecase.dto';

export default class UpdateUseCase implements UpdateUseCaseInterface {
  constructor(
    private readonly organizationRepository: OrganizationGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: UpdateUseCaseInputDto): Promise<void> {
    const org = await this.findByIdUseCase.execute({ id: input.id });

    if (input.slug !== undefined && input.slug !== org.slug) {
      const existing = await this.organizationRepository.findBySlug(input.slug);
      if (existing) {
        throw new EntityValidationError([
          { field: 'slug', message: 'Organization slug already taken' },
        ]);
      }
    }

    org.updateOrganization(input);

    await this.organizationRepository.update(org);
  }
}