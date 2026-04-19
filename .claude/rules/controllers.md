---
paths:
  - "src/infra/http/**/*.ts"
---

# Infrastructure HTTP Layer — Rules

## NestJS Module

```typescript
@Module({
  controllers: [MemberController],
  providers: [
    MemberService,
    { provide: MemberFacade, useFactory: () => MemberFacadeFactory.create() },
  ],
})
export class MemberModule {}
```

## Service (Thin Adapter)

```typescript
@Injectable()
export class MemberService {
  @Inject(MemberFacade)
  private readonly facade: MemberFacade;

  async findById(input: FindByIdFacadeInputDto) {
    return this.facade.findById(input);
  }
}
```

## Controller

Guards are applied **once** on the `@Controller`. The `@Roles({ role })` decorator
states the minimum role required per route.

`@Body()` / `@Query()` / `@Param()` inputs must be **concrete classes** with
`class-validator` decorators. The global `ValidationPipe` is configured with
`whitelist: true` and `forbidNonWhitelisted: true`, which only applies to class
instances — `Pick<>`, `Omit<>`, inline type literals and plain interfaces are
silently skipped and open a trust hole on untrusted input.

```typescript
@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('members')
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Get()
  @Roles({ role: MemberRole.VIEWER })
  async list(@Request() req: { user: JwtPayload }) {
    return this.service.listByOrganization({
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id/role')
  @Roles({ role: MemberRole.ADMIN })
  async changeRole(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
    @Body() body: ChangeRoleBodyDto,
  ) {
    await this.service.changeRole({
      id,
      organizationId: req.user.organizationId,
      role: body.role,
    });
  }
}
```

### Body DTOs

One body class per mutating route, colocated under `src/infra/http/[module]/dto/`:

```typescript
// src/infra/http/member/dto/change-role.body.dto.ts
export class ChangeRoleBodyDto {
  @IsEnum(MemberRole)
  role!: MemberRole;
}
```

Never reuse a facade/use case DTO as a body type — those include fields the
client must not set (`id`, `organizationId`, `userId`, …). Derive the body class
from the request surface you actually expose.

### `@Roles` decorator

```typescript
// src/infra/http/shared/roles.decorator.ts
export interface RolePermission {
  role: MemberRole; // minimum level required
}
export const Roles = Reflector.createDecorator<RolePermission>();
```

Hierarchy (low to high): `VIEWER < DESIGNER < ADMIN`.

- `@Roles({ role: MemberRole.VIEWER })` — any authenticated member
- `@Roles({ role: MemberRole.DESIGNER })` — DESIGNER or ADMIN
- `@Roles({ role: MemberRole.ADMIN })` — ADMIN only
- No decorator → public route (still passes through `AuthGuard` if the controller applies it).

### `JwtPayload`

```typescript
// src/infra/http/auth/auth-guard.ts
export interface JwtPayload {
  userId: string;
  memberId: string;
  organizationId: string;
  role: MemberRole;
}
```

`req.user.organizationId` is the canonical source of tenancy for queries.
**Never** read `organizationId` from the body or query string.

## Available Guards

| Guard | Purpose |
|-------|-----|
| `AuthGuard` | Verifies JWT Bearer and populates `req.user: JwtPayload` |
| `RolesGuard` | Reads `@Roles({ role })` and compares against `req.user.role` |
| `EngineAuthGuard` | Validates HMAC API key (endpoints `/engine/*`) |

## Exception Filters

Global, in `src/infra/http/shared/errors/`. They map domain errors to HTTP:

| Domain error | HTTP |
|---|---|
| `NotFoundError` | 404 |
| `BadLoginError` | 401 |
| `UnauthorizedError` | 401 |
| `TokenExpiredError` | 401 |
| `ForbiddenError` | 403 |
| `EntityValidationError` | 422 |

Exception Factory: `src/infra/http/shared/errors/exception-factory.ts`.
