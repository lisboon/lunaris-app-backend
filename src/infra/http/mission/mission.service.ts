import MissionFacade from '@/modules/mission/facade/mission.facade';
import {
  CreateFacadeInputDto,
  FindByIdFacadeInputDto,
  GetActiveFacadeInputDto,
  GetActiveHashFacadeInputDto,
  ListVersionsFacadeInputDto,
  PublishFacadeInputDto,
  SaveVersionFacadeInputDto,
  UpdateFacadeInputDto,
} from '@/modules/mission/facade/mission.facade.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MissionService {
  @Inject(MissionFacade)
  private readonly missionFacade: MissionFacade;

  async findById(input: FindByIdFacadeInputDto) {
    return this.missionFacade.findById(input);
  }

  async create(input: CreateFacadeInputDto) {
    return this.missionFacade.create(input);
  }

  async update(input: UpdateFacadeInputDto) {
    return this.missionFacade.update(input);
  }

  async saveVersion(input: SaveVersionFacadeInputDto) {
    return this.missionFacade.saveVersion(input);
  }

  async publish(input: PublishFacadeInputDto) {
    return this.missionFacade.publish(input);
  }

  async listVersions(input: ListVersionsFacadeInputDto) {
    return this.missionFacade.listVersions(input);
  }

  async getActive(input: GetActiveFacadeInputDto) {
    return this.missionFacade.getActive(input);
  }

  async getActiveHash(input: GetActiveHashFacadeInputDto) {
    return this.missionFacade.getActiveHash(input);
  }
}
