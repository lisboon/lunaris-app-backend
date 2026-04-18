import { FindByIdUseCaseInterface } from '../usecase/find-by-id/find-by-id.usecase.dto';
import { UpdateUseCaseInterface } from '../usecase/update/update.usecase.dto';
import { DeleteUseCaseInterface } from '../usecase/delete/delete.usecase.dto';
import {
  OrganizationFacadeInterface,
  FindByIdFacadeInputDto,
  FindByIdFacadeOutputDto,
  UpdateFacadeInputDto,
  DeleteFacadeInputDto,
} from './organization.facade.dto';

export default class OrganizationFacade implements OrganizationFacadeInterface {
  constructor(
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly updateUseCase: UpdateUseCaseInterface,
    private readonly deleteUseCase: DeleteUseCaseInterface,
  ) {}

  async findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto> {
    const organization = await this.findByIdUseCase.execute(data);
    return organization.toJSON();
  }

  async update(data: UpdateFacadeInputDto): Promise<void> {
    return this.updateUseCase.execute(data);
  }

  async delete(data: DeleteFacadeInputDto): Promise<void> {
    return this.deleteUseCase.execute(data);
  }
}
