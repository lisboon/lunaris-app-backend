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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { InviteService } from './invite.service';
import { CreateInviteBodyDto } from './dto/create-invite.body.dto';
import { AcceptInviteUseCaseInputDto } from '@/modules/invite/usecase/accept-invite/accept-invite.usecase.dto';

@ApiTags('Invites')
@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ role: MemberRole.ADMIN })
  @ApiOperation({ summary: 'Create an invite for a new member' })
  async create(
    @Request() req: { user: JwtPayload },
    @Body() body: CreateInviteBodyDto,
  ) {
    return this.inviteService.create({
      email: body.email,
      role: body.role,
      organizationId: req.user.organizationId,
      invitedById: req.user.memberId,
    });
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ role: MemberRole.ADMIN })
  @ApiOperation({ summary: 'List all invites of the organization' })
  async list(@Request() req: { user: JwtPayload }) {
    return this.inviteService.list({
      organizationId: req.user.organizationId,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ role: MemberRole.ADMIN })
  @ApiOperation({ summary: 'Cancel an invite' })
  async cancel(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    await this.inviteService.cancel({
      id,
      organizationId: req.user.organizationId,
    });
  }

  @Post(':id/resend')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ role: MemberRole.ADMIN })
  @ApiOperation({ summary: 'Resend an invite' })
  async resend(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    await this.inviteService.resend({
      id,
      organizationId: req.user.organizationId,
    });
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an invite (public)' })
  async accept(@Body() body: AcceptInviteUseCaseInputDto) {
    return this.inviteService.accept(body);
  }
}
