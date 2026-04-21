import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, JwtPayload } from '../auth/auth-guard';
import { RolesGuard } from '../auth/roles-guard';
import { Roles } from '../shared/roles.decorator';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { UserService } from './user.service';
import { RegisterUseCaseInputDto } from '@/modules/user/usecase/register/register.usecase.dto';
import { LoginUseCaseInputDto } from '@/modules/user/usecase/login/login.usecase.dto';

const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } } as const;

@ApiTags('Auth')
@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Register user with new organization' })
  async register(@Body() body: RegisterUseCaseInputDto) {
    return this.userService.register(body);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
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
