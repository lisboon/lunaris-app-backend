import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { EngineAuthGuard, EngineAuthPayload } from '../auth/engine-auth-guard';
import { MissionService } from '../mission/mission.service';

@ApiTags('Engine')
@ApiSecurity('engine-api-key')
@SkipThrottle({ default: true })
@UseGuards(EngineAuthGuard)
@Controller('missions/engine')
export class EngineController {
  constructor(private readonly missionService: MissionService) {}

  @Get(':id/active')
  @ApiOperation({
    summary:
      'M2M — Return the compiled missionData for the Unreal plugin (auth via x-api-key)',
  })
  async getActive(
    @Param('id') missionId: string,
    @Request() req: { engine: EngineAuthPayload },
  ) {
    return this.missionService.getActive({
      missionId,
      organizationId: req.engine.organizationId,
    });
  }
}
