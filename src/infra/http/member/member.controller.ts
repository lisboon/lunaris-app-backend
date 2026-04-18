import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { MemberService } from './member.service';
import { ChangeRoleUseCaseInputDto } from '@/modules/member/usecase/change-role/change-role.usecase.dto';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @ApiOperation({ summary: 'List all members of the organization' })
  @Roles({ role: MemberRole.VIEWER })
  async listByOrganization(@Request() req: { user: JwtPayload }) {
    return this.memberService.listByOrganization({
      organizationId: req.user.organizationId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by id' })
  @Roles({ role: MemberRole.VIEWER })
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.memberService.findById({
      id,
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change a member role' })
  @Roles({ role: MemberRole.ADMIN })
  async changeRole(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
    @Body() body: Pick<ChangeRoleUseCaseInputDto, 'role'>,
  ) {
    await this.memberService.changeRole({
      id,
      organizationId: req.user.organizationId,
      role: body.role,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a member from the organization' })
  @Roles({ role: MemberRole.ADMIN })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    await this.memberService.remove({
      id,
      organizationId: req.user.organizationId,
    });
  }
}
