import { UserGateway } from '../../gateway/user.gateway';
import { OrganizationGateway } from '@/modules/organization/gateway/organization.gateway';
import { MemberGateway } from '@/modules/member/gateway/member.gateway';
import { User } from '../../domain/user.entity';
import { Organization } from '@/modules/organization/domain/organization.entity';
import { Member } from '@/modules/member/domain/member.entity';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { PasswordHashService } from '@/modules/@shared/domain/services/password-hash.service';
import { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import {
  RegisterInputDto,
  RegisterOutputDto,
  RegisterUseCaseInterface,
} from './register.usecase.dto';

export default class RegisterUseCase implements RegisterUseCaseInterface {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly userGateway: UserGateway,
    private readonly organizationGateway: OrganizationGateway,
    private readonly memberGateway: MemberGateway,
    private readonly passwordHashService: PasswordHashService,
  ) {}

  async execute(input: RegisterInputDto): Promise<RegisterOutputDto> {
    const existingUser = await this.userGateway.findByEmail(input.email);
    if (existingUser) {
      throw new EntityValidationError([
        { field: 'email', message: 'Email already registered' },
      ]);
    }

    const existingOrg = await this.organizationGateway.findBySlug(
      input.organizationSlug,
    );
    if (existingOrg) {
      throw new EntityValidationError([
        { field: 'organizationSlug', message: 'Organization slug already taken' },
      ]);
    }

    const hashedPassword = await this.passwordHashService.hash(input.password);

    const user = User.create({
      email: input.email,
      name: input.name,
      password: hashedPassword,
    });

    const organization = Organization.create({
      name: input.organizationName,
      slug: input.organizationSlug,
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