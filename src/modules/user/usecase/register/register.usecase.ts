import { UserGateway } from '../../gateway/user.gateway';
import { User } from '../../domain/user.entity';
import { Organization } from '@/modules/organization/domain/organization.entity';
import { Member } from '@/modules/member/domain/member.entity';
import { OrganizationGateway } from '@/modules/organization/gateway/organization.gateway';
import { MemberGateway } from '@/modules/member/gateway/member.gateway';
import { PasswordHashService } from '@/modules/@shared/domain/services/password-hash.service';
import { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MemberRole } from '@/modules/@shared/domain/enums';
import {
  RegisterUseCaseInputDto,
  RegisterUseCaseInterface,
  RegisterUseCaseOutputDto,
} from './register.usecase.dto';

export default class RegisterUseCase implements RegisterUseCaseInterface {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly userGateway: UserGateway,
    private readonly organizationGateway: OrganizationGateway,
    private readonly memberGateway: MemberGateway,
    private readonly passwordHashService: PasswordHashService,
  ) {}

  async execute(
    data: RegisterUseCaseInputDto,
  ): Promise<RegisterUseCaseOutputDto> {
    const existingUser = await this.userGateway.findByEmail(data.email);
    if (existingUser) {
      throw new EntityValidationError([
        { field: 'email', message: 'Email already in use' },
      ]);
    }

    const existingOrg = await this.organizationGateway.findBySlug(
      data.organizationSlug,
    );
    if (existingOrg) {
      throw new EntityValidationError([
        { field: 'organizationSlug', message: 'Slug already in use' },
      ]);
    }

    const hashedPassword = await this.passwordHashService.hash(data.password);

    const user = User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
    });

    const organization = Organization.create({
      name: data.organizationName,
      slug: data.organizationSlug,
    });

    const member = Member.create({
      userId: user.id,
      organizationId: organization.id,
      role: MemberRole.ADMIN,
    });

    await this.transactionManager.execute(async (trx) => {
      await this.userGateway.create(user, trx);
      await this.organizationGateway.create(organization, trx);
      await this.memberGateway.create(member, trx);
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      member: { id: member.id, role: member.role },
    };
  }
}
