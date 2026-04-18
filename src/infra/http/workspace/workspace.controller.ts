import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { WorkspaceService } from './workspace.service';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { CreateUseCaseInputDto } from '@/modules/workspace/usecase/create/create.usecase.dto';
import { UpdateUseCaseInputDto } from '@/modules/workspace/usecase/update/update.usecase.dto';
import { SearchUseCaseInputDto } from '@/modules/workspace/usecase/search/search.usecase.dto';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @Roles({ role: MemberRole.ADMIN })
  async create(
    @Request() req: { user: JwtPayload },
    @Body() body: CreateUseCaseInputDto,
  ) {
    return this.workspaceService.create({
      name: body.name,
      organizationId: req.user.organizationId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Search workspaces in the organization' })
  @Roles({ role: MemberRole.VIEWER })
  async search(
    @Request() req: { user: JwtPayload },
    @Query() query: SearchUseCaseInputDto,
  ) {
    return this.workspaceService.search({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workspace by id' })
  @Roles({ role: MemberRole.VIEWER })
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.workspaceService.findById({
      id,
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workspace' })
  @Roles({ role: MemberRole.ADMIN })
  async update(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
    @Body() body: UpdateUseCaseInputDto,
  ) {
    await this.workspaceService.update({
      id,
      organizationId: req.user.organizationId,
      name: body.name,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a workspace' })
  @Roles({ role: MemberRole.ADMIN })
  async delete(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    await this.workspaceService.delete({
      id,
      organizationId: req.user.organizationId,
    });
  }
}
