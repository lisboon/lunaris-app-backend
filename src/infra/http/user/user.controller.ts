import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { UserService } from './user.service';
import { RegisterUseCaseInputDto } from '@/modules/user/usecase/register/register.usecase.dto';
import { LoginUseCaseInputDto } from '@/modules/user/usecase/login/login.usecase.dto';

@ApiTags('Auth')
@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user with new organization' })
  async register(@Body() body: RegisterUseCaseInputDto) {
    return this.userService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(@Body() body: LoginUseCaseInputDto) {
    return this.userService.login(body);
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ role: MemberRole.VIEWER })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async me(@Request() req: { user: JwtPayload }) {
    return this.userService.findById({ id: req.user.userId });
  }
}
