import { OrganizationGateway } from '../../gateway/organization.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  DeleteUseCaseInputDto,
  DeleteUseCaseInterface,
} from './delete.usecase.dto';

export default class DeleteUseCase implements DeleteUseCaseInterface {
  constructor(
    private readonly organizationGateway: OrganizationGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: DeleteUseCaseInputDto): Promise<void> {
    const organization = await this.findByIdUseCase.execute({ id: input.id });

    organization.delete();

    await this.organizationGateway.update(organization);
  }
}
