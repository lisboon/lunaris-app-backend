import { UserGateway } from '../../gateway/user.gateway';
import { MemberGateway } from '@/modules/member/gateway/member.gateway';
import { OrganizationGateway } from '@/modules/organization/gateway/organization.gateway';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { PasswordHashService } from '@/modules/@shared/domain/services/password-hash.service';
import { JwtTokenService } from '@/modules/@shared/domain/services/jwt-token.service';
import { Organization } from '@/modules/organization/domain/organization.entity';
import {
  LoginInputDto,
  LoginOutputDto,
  LoginUseCaseInterface,
} from './login.usecase.dto';

export default class LoginUseCase implements LoginUseCaseInterface {
  constructor(
    private readonly userGateway: UserGateway,
    private readonly memberGateway: MemberGateway,
    private readonly organizationGateway: OrganizationGateway,
    private readonly passwordHashService: PasswordHashService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const user = await this.userGateway.findByEmail(input.email);
    if (!user) {
      throw new BadLoginError();
    }

    const passwordMatch = await this.passwordHashService.compare(
      input.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadLoginError();
    }

    const membership = await this.memberGateway.findByUserId(user.id);
    if (!membership) {
      throw new NotFoundError(user.id, { name: 'Membership' });
    }

    const organization = await this.organizationGateway.findById(
      membership.organizationId,
    );
    if (!organization) {
      throw new NotFoundError(membership.organizationId, Organization);
    }

    const accessToken = this.jwtTokenService.sign({
      userId: user.id,
      memberId: membership.id,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      role: membership.role,
    };
  }
}
