import { Inject, Injectable } from '@nestjs/common';
import OrganizationFacade from '@/modules/organization/facade/organization.facade';
import {
  FindByIdFacadeInputDto,
  UpdateFacadeInputDto,
  DeleteFacadeInputDto,
} from '@/modules/organization/facade/organization.facade.dto';

@Injectable()
export class OrganizationService {
  @Inject(OrganizationFacade)
  private readonly organizationFacade: OrganizationFacade;

  async findById(input: FindByIdFacadeInputDto) {
    return this.organizationFacade.findById(input);
  }

  async update(input: UpdateFacadeInputDto) {
    return this.organizationFacade.update(input);
  }

  async delete(input: DeleteFacadeInputDto) {
    return this.organizationFacade.delete(input);
  }
}
