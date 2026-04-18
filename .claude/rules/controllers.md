---
paths:
  - "src/infra/http/**/*.ts"
---

# Infrastructure HTTP Layer — Regras

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

Guards são aplicados **uma vez** no `@Controller` e o decorator `@Roles({ role })`
anota o nível mínimo exigido por rota.

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
    @Body() body: { role: MemberRole },
  ) {
    await this.service.changeRole({
      id,
      organizationId: req.user.organizationId,
      role: body.role,
    });
  }
}
```

### `@Roles` decorator

```typescript
// src/infra/http/shared/roles.decorator.ts
export interface RolePermission {
  role: MemberRole; // nível mínimo exigido
}
export const Roles = Reflector.createDecorator<RolePermission>();
```

Hierarquia (do menor para o maior): `VIEWER < DESIGNER < ADMIN`.

- `@Roles({ role: MemberRole.VIEWER })` — qualquer membro autenticado
- `@Roles({ role: MemberRole.DESIGNER })` — DESIGNER ou ADMIN
- `@Roles({ role: MemberRole.ADMIN })` — apenas ADMIN
- Ausência do decorator → rota pública (mas ainda passa por `AuthGuard` se o controller aplicar).

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

`req.user.organizationId` é a fonte canônica do tenant para queries. **Nunca** leia
`organizationId` do body ou da query string.

## Available Guards

| Guard | Purpose |
|-------|-----|
| `AuthGuard` | Verifica JWT Bearer e popula `req.user: JwtPayload` |
| `RolesGuard` | Lê `@Roles({ role })` e compara com `req.user.role` |
| `EngineAuthGuard` | Valida API key HMAC (endpoints `/engine/*`) |

## Exception Filters

Globais em `src/infra/http/shared/errors/`. Mapeiam erros de domínio para HTTP:

| Domain error | HTTP |
|---|---|
| `NotFoundError` | 404 |
| `BadLoginError` | 401 |
| `UnauthorizedError` | 401 |
| `TokenExpiredError` | 401 |
| `ForbiddenError` | 403 |
| `EntityValidationError` | 422 |

Exception Factory: `src/infra/http/shared/errors/exception-factory.ts`.
