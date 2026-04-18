import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { EngineApiKeysService } from './engine-api-keys.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUseCaseInputDto } from '@/modules/engine/usecase/create/create.usecase.dto';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('api-keys')
export class EngineApiKeysController {
  constructor(private readonly engineApiKeysService: EngineApiKeysService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create an API Key for the Unreal plugin — returns the raw key once',
  })
  @Roles({ role: MemberRole.ADMIN })
  async create(
    @Request() req: { user: JwtPayload },
    @Body() body: CreateUseCaseInputDto,
  ) {
    return this.engineApiKeysService.create({
      organizationId: req.user.organizationId,
      name: body.name,
      expiresAt: body.expiresAt,
    });
  }

  @Get()
  @ApiOperation({ summary: "List the organization's API Keys" })
  @Roles({ role: MemberRole.ADMIN })
  async search(@Request() req: { user: JwtPayload }) {
    return this.engineApiKeysService.search({
      organizationId: req.user.organizationId,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke an API Key' })
  @Roles({ role: MemberRole.ADMIN })
  async revoke(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    await this.engineApiKeysService.revoke({
      id,
      organizationId: req.user.organizationId,
    });
  }
}
