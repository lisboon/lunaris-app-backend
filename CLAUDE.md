# lunaris-app-backend

NestJS backend for a logic engine and mission orchestration (UE5). DDD + Clean Architecture.

## MANDATORY RULE: Keep Your Skills Up to Date

**After ANY interaction with the project** — whether it's reading code, editing files, creating use cases, fixing bugs, refactoring, answering questions, or any other task — **you MUST update the corresponding skill** in `.claude/skills/` with what you've learned.

This includes, but is not limited to:
- **New use cases, entities, or routes** created → add to the module's skill
- **Changes to DTOs or validations** → update in the skill
- **New API endpoints** → document in the module's skill and in `/docs/api/insomnia.json`
- **New patterns or guards** → update `project/SKILL.md`
- **Changes to business rules** → update `lunaris-business-rules`
- **New external integrations** → update `integrations/SKILL.md`
- **Changes to the stack or dependencies** → update `project/SKILL.md` and `lunaris-ecosystem`

**Skills are the lifeblood of the project. If they are out of date, all future interactions will be compromised.**

---

## Architecture

- **Modules Layer** (`src/modules/`) — Pure business logic, without a framework
- **Infra Layer** (`src/infra/`) — NestJS controllers, Prisma, external integrations
- **Dependency**: Infra → Modules (never the other way around)

## Domain Model (Multi-Tenant B2B)

Lunaris follows a Slack/Linear-style multi-tenancy model for AAA game studios.

| Entity | Role | Scope |
|---|---|---|
| `Organization` | The tenant (studio: CD Projekt, Ubisoft). Top-level isolation boundary. | Global |
| `Workspace` | Project/team inside an Organization (e.g. "Cyberpunk Team"). Owns missions and game logic. | Per-Organization |
| `User` | Real person. | Global (same user may belong to many orgs) |
| `Membership` | Link `User × Organization` (and later Workspace). Carries role/permissions (RBAC). | Per-Organization |

**Tenancy rules:**
- Every Prisma query (via `PrismaQueryBuilder`) **must** filter by `organizationId`.
- Workspace-scoped resources also carry `workspaceId`.
- Auth resolves the `(organizationId, userId)` pair from the current session; permissions come from `Membership`, never from `User` directly.

## Stack

- **Runtime**: Node.js 24, TypeScript 5.7
- **Framework**: NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Build/Transform**: SWC (`@swc/core`)
- **ORM**: Prisma 7 (`@prisma/client`, generated at `generated/prisma/client`)
- **Database**: PostgreSQL
- **Auth**: `@nestjs/jwt` + `jsonwebtoken`, `bcrypt` for password hashing
- **Validation**: `class-validator` + `class-transformer`
- **API docs**: `@nestjs/swagger`
- **Security**: `helmet`, `@nestjs/throttler`
- **Testing**: Jest 30 + `ts-jest`, `supertest` (e2e)
- **Tooling**: ESLint 9, Prettier 3, commitlint + husky (conventional commits)
- **IDs**: `uuid` (v4)

## Conventions

- Files (per module):
  - Domain: `[name].entity.ts`, `validators/[name].validator.ts`
  - Use case: `usecase/[action]/[action].usecase.ts` + `[action].usecase.dto.ts`
  - Gateway: `gateway/[name].gateway.ts`
  - Repository: `repository/[name].repository.ts`
  - Facade: `facade/[name].facade.ts` + `facade/[name].facade.dto.ts`
  - Factory: `factory/facade.factory.ts` (one per module, fixed name)
  - Events: `event/[event-name].event.ts`
- Class names: PascalCase with semantic suffix (`User`, `LoginUseCase`, `UserFacade`, `UserRepository`, `UserFacadeFactory`). Entities drop the `Entity` suffix — the file name already says `user.entity.ts`.
- DTOs: classes annotated with `class-validator` that act as type AND validator — `{Action}UseCaseInputDto` / `{Action}UseCaseOutputDto` in use cases, `{Action}FacadeInputDto` / `{Action}FacadeOutputDto` in facades. Pure interfaces (e.g. `InviteFacadeInterface`) are exported alongside the classes when useful.
- Controller `@Body()` must be a concrete class with `class-validator` decorators — **never** `Pick<>`, `Omit<>`, or structural type literals. The global `ValidationPipe` only enforces `whitelist`/`forbidNonWhitelisted` on classes.
- `findById` tenancy exceptions:
  - `UserGateway.findById(id)` — `User` is global
  - `OrganizationGateway.findById(id)` — the org is itself the tenant
- Enums: UPPER_SNAKE_CASE
- Path alias: `@/*` → `./src/*`
- Emails: always go through `normalizeEmail()` (`@/modules/@shared/domain/utils/email`) inside the entity constructor and any repository lookup by email.

## Patterns

- **Soft delete**: tenant-scoped entities use `deletedAt`. `Invite` is an exception: it uses a status cycle (`PENDING → ACCEPTED | CANCELLED`).
- **Cascade**: deleting a tenant soft-deletes its children in the same transaction (e.g. `OrganizationDeleteUseCase` calls `memberGateway.softDeleteByOrganization` and `inviteGateway.cancelPendingByOrganization` inside `transactionManager.execute`).
- **Transactions**: gateways that participate in coordinated writes accept `trx?: TransactionContext`. Use cases orchestrate via `transactionManager.execute(async (trx) => ...)`. Pass `{ isolationLevel: 'Serializable' }` as the second argument when the critical section depends on read-modify-write invariants (e.g. last-admin checks).
- **Domain events**: the entity accumulates events via `this.addEvent(event)`; the **use case** calls `entity.pullEvents()` and dispatches **after** persistence commits (or after `transactionManager.execute` returns). Never dispatch from inside the entity.
- **Commits**: conventional commits (commitlint + husky)
- **Testing**: Jest + SWC, `makeSut()` pattern with `jest.fn()`; entities tested without mocks, use cases mock gateways, facades mock use cases.
- **Validation**: `class-validator` on DTOs; Notification pattern in entities (collects all errors before throwing `EntityValidationError`).
- **Errors**: `NotFoundError`, `BadLoginError`, `EntityValidationError`, `ForbiddenError`, `UnauthorizedError`, `TokenExpiredError`.
- **Guards**: `@UseGuards(AuthGuard, RolesGuard)` on the `@Controller`, `@Roles({ role: MemberRole.X })` per route (minimum level). See `.claude/rules/controllers.md`.
- **Pagination**: `SearchParams<Filter>` / `SearchResult<T>` from `@shared` (camelCase: `perPage`, `sortDir`, `currentPage`, `lastPage`).


## Commands

```bash
npm run start        # SWC dev server
npm run start:dev    # Watch mode
npm run build        # Production build
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Coverage
npm run lint         # ESLint
npm run format       # Prettier
```

## Skills (Slash Commands)

For details on each module (use cases, routes, entities), use the following skills:

- **In Development**

## Rules (Contextual)

Path-specific rules are automatically loaded when working with files:

- **In Development**

## Shared Skills (Lunaris Ecosystem)

Skills with the `lunaris-` prefix are symlinks to `~/lunaris-claude/` and work in all repos:

- **In Development**

> To configure the symlinks, run `~/lunaris-claude/setup.sh`. See `~/lunaris-claude/README.md` for details.
