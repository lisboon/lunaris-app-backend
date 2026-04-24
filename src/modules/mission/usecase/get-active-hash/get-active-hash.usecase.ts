import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  GetActiveHashInputDto,
  GetActiveHashOutputDto,
  GetActiveHashUseCaseInterface,
} from './get-active-hash.usecase.dto';

export default class GetActiveHashUseCase implements GetActiveHashUseCaseInterface {
  constructor(private readonly findByIdUseCase: FindByIdUseCaseInterface) {}

  async execute(input: GetActiveHashInputDto): Promise<GetActiveHashOutputDto> {
    const mission = await this.findByIdUseCase.execute({
      id: input.missionId,
      organizationId: input.organizationId,
    });

    if (!mission.activeHash) {
      throw new NotFoundError(input.missionId, {
        name: 'MissionActiveVersion',
      });
    }

    return { hash: mission.activeHash };
  }
}
