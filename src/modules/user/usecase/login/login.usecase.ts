import { UserGateway } from '../../gateway/user.gateway';
import { MemberGateway } from '@/modules/member/gateway/member.gateway';
import { OrganizationGateway } from '@/modules/organization/gateway/organization.gateway';
import { PasswordHashService } from '@/modules/@shared/domain/services/password-hash.service';
import { JwtTokenService } from '@/modules/@shared/domain/services/jwt-token.service';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Organization } from '@/modules/organization/domain/organization.entity';
import { Member } from '@/modules/member/domain/member.entity';
import {
  LoginUseCaseInputDto,
  LoginUseCaseInterface,
  LoginUseCaseOutputDto,
} from './login.usecase.dto';

export default class LoginUseCase implements LoginUseCaseInterface {
  constructor(
    private readonly userGateway: UserGateway,
    private readonly memberGateway: MemberGateway,
    private readonly organizationGateway: OrganizationGateway,
    private readonly passwordHashService: PasswordHashService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(data: LoginUseCaseInputDto): Promise<LoginUseCaseOutputDto> {
    const user = await this.userGateway.findByEmail(data.email);
    if (!user) {
      throw new BadLoginError();
    }

    const isPasswordValid = await this.passwordHashService.compare(
      data.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadLoginError();
    }

    const member = await this.memberGateway.findByUserId(user.id);
    if (!member) {
      throw new NotFoundError(user.id, Member);
    }

    const organization = await this.organizationGateway.findById(
      member.organizationId,
    );
    if (!organization) {
      throw new NotFoundError(member.organizationId, Organization);
    }

    const accessToken = this.jwtTokenService.sign({
      userId: user.id,
      memberId: member.id,
      organizationId: organization.id,
      role: member.role,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      role: member.role,
    };
  }
}
