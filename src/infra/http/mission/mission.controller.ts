import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MissionService } from './mission.service';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { CreateUseCaseInputDto } from '@/modules/mission/usecase/create/create.usecase.dto';
import { SaveVersionInputDto } from '@/modules/mission/usecase/save-version/save-version.usecase.dto';
import { PublishInputDto } from '@/modules/mission/usecase/publish/publish.usecase.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Missions')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('workspaces/:workspaceId/missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mission (initial status: DRAFT)' })
  @Roles({ role: 'DESIGNER' })
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: JwtPayload },
    @Body() body: CreateUseCaseInputDto,
  ) {
    return this.missionService.create({
      id: body.id,
      name: body.name,
      description: body.description,
      organizationId: req.user.organizationId,
      workspaceId,
      authorId: req.user.memberId,
    });
  }

  @Post(':id/versions')
  @ApiOperation({
    summary: 'Save a new mission version — computes SHA-256 of missionData',
  })
  @Roles({ role: 'DESIGNER' })
  async saveVersion(
    @Param('id') missionId: string,
    @Request() req: { user: JwtPayload },
    @Body() body: SaveVersionInputDto,
  ) {
    return this.missionService.saveVersion({
      graphData: body.graphData,
      missionData: body.missionData,
      missionId,
      organizationId: req.user.organizationId,
      authorId: req.user.memberId,
    });
  }

  @Put(':id/publish')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Publish a version as active — runtime starts serving this hash',
  })
  @Roles({ role: 'DESIGNER' })
  async publish(
    @Param('id') missionId: string,
    @Request() req: { user: JwtPayload },
    @Body() body: PublishInputDto,
  ) {
    return this.missionService.publish({
      missionId,
      organizationId: req.user.organizationId,
      versionHash: body.versionHash,
    });
  }

  @Get(':id/versions')
  @ApiOperation({
    summary: 'List paginated mission versions (newest first)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 10 })
  @Roles({ role: 'VIEWER' })
  async listVersions(
    @Param('id') missionId: string,
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.missionService.listVersions({
      missionId,
      organizationId: req.user.organizationId,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id/active')
  @ApiOperation({
    summary:
      'Return the compiled missionData of the currently published version',
  })
  @Roles({ role: 'VIEWER' })
  async getActive(
    @Param('id') missionId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.missionService.getActive({
      missionId,
      organizationId: req.user.organizationId,
    });
  }
}
