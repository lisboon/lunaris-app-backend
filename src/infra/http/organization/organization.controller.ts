import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationBodyDto } from './dto/update-organization.body.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Get current organization' })
  @Roles({ role: MemberRole.VIEWER })
  async findById(@Request() req: { user: JwtPayload }) {
    return this.organizationService.findById({
      id: req.user.organizationId,
    });
  }

  @Patch()
  @ApiOperation({ summary: 'Update current organization' })
  @Roles({ role: MemberRole.ADMIN })
  async update(
    @Request() req: { user: JwtPayload },
    @Body() body: UpdateOrganizationBodyDto,
  ) {
    await this.organizationService.update({
      id: req.user.organizationId,
      name: body.name,
      slug: body.slug,
    });
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete current organization' })
  @Roles({ role: MemberRole.ADMIN })
  async delete(@Request() req: { user: JwtPayload }) {
    await this.organizationService.delete({
      id: req.user.organizationId,
    });
  }
}
