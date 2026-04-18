import { OrganizationGateway } from '../../gateway/organization.gateway';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  DeleteUseCaseInputDto,
  DeleteUseCaseInterface,
} from './delete.usecase.dto';

export default class DeleteUseCase implements DeleteUseCaseInterface {
  constructor(
    private readonly organizationRepository: OrganizationGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
  ) {}

  async execute(input: DeleteUseCaseInputDto): Promise<void> {
    const org = await this.findByIdUseCase.execute({ id: input.id });
    org.delete();
    await this.organizationRepository.update(org);
  }
}