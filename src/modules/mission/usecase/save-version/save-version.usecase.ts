import {
  MissionGateway,
  MissionVersionPersistData,
} from '../../gateway/mission.gateway';
import { MissionHashService } from '../../domain/services/mission-hash.service';
import { DAGValidatorService } from '../../domain/services/dag-validator.service';
import { FindByIdUseCaseInterface } from '../find-by-id/find-by-id.usecase.dto';
import {
  SaveVersionInputDto,
  SaveVersionOutputDto,
  SaveVersionUseCaseInterface,
} from './save-version.usecase.dto';

export default class SaveVersionUseCase implements SaveVersionUseCaseInterface {
  constructor(
    private readonly missionRepository: MissionGateway,
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly hashService: MissionHashService,
    private readonly dagValidator: DAGValidatorService,
  ) {}

  async execute(input: SaveVersionInputDto): Promise<SaveVersionOutputDto> {
    await this.findByIdUseCase.execute({
      id: input.missionId,
      organizationId: input.organizationId,
    });

    const validation = this.dagValidator.validate(input.graphData);
    const hash = this.hashService.compute(input.missionData);

    const versionPersistData: MissionVersionPersistData = {
      missionId: input.missionId,
      organizationId: input.organizationId,
      hash,
      graphData: input.graphData,
      missionData: input.missionData,
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors : null,
      authorId: input.authorId,
    };

    const savedVersion =
      await this.missionRepository.saveVersion(versionPersistData);

    return {
      id: savedVersion.id,
      missionId: savedVersion.missionId,
      hash: savedVersion.hash,
      isValid: savedVersion.isValid,
      validationErrors: savedVersion.validationErrors,
      createdAt: savedVersion.createdAt,
    };
  }
}