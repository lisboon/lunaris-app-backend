# lunaris-app-backend

NestJS backend for the **Lunaris Mission Orchestration Engine** — the "Figma for Quests" for Unreal Engine 5. DDD + Clean Architecture.

## What Lunaris is (immutable product context)

- **Web app (React Flow, in dev)**: Game Designers visually compose quest logic (nodes + edges) on a canvas.
- **Backend (this repo)**: validates graph integrity (`DAGValidatorService` — cycle / dead-end / dangling-edge / unreachable detection), computes SHA-256 over the compiled `missionData` (`MissionHashService`), persists immutable `MissionVersion` snapshots, serves the active version to the plugin.
- **UE5 plugin (C++, in dev)**: consumes the compiled JSON contract via `GET /missions/engine/:id/active` authenticated by `x-api-key` (HMAC-hashed). Quest updates ship without rebuilding the game.
- **Why it matters**: AAA studios spend weeks rebuilding binaries to rebalance quests. Lunaris decouples quest logic from the game binary — content patches in minutes.
- **Focus**: runtime performance (versioned contract cache) + B2B data security (per-org isolation + per-org API keys).

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

Lunaris follows a Slack/Linear-style multi-tenancy model for AAA game studios. Tenants are studios (CD Projekt, Ubisoft, Rockstar) that cannot see each other's data. Full reference in `memory/project_domain_model.md`.

| Entity | Role | Scope | Soft-delete |
|---|---|---|---|
| `User` | Real person. Same user may belong to many orgs. | Global | `deletedAt` |
| `Organization` | Tenant (studio). Top-level isolation boundary. | Global | `deletedAt` |
| `Workspace` | Project/team inside an Organization (e.g. "Cyberpunk Team"). Owns missions. | Per-Organization | `deletedAt` |
| `Member` | `User × Organization` link carrying role (VIEWER < DESIGNER < ADMIN). | Per-Organization | `deletedAt` |
| `Invite` | Invitation for a new Member (pre-User). | Per-Organization | Status (`PENDING → ACCEPTED \| CANCELLED \| EXPIRED`) |
| `Mission` | Quest. Graph + current `activeHash`. | Per-Workspace | `deletedAt` |
| `MissionVersion` | Immutable snapshot (graph + compiled `missionData` + SHA-256 hash). | Per-Mission | Never (immutable by design) |
| `OrganizationApiKey` | HMAC-hashed API key for the UE5 plugin. | Per-Organization | `revokedAt` (not `deletedAt`) |
| `PlayerMissionState` | Runtime progress of a mission for a specific player. | Per-Mission + Player | n/a |

### Canonical persona: "João at Ubisoft"

João is a Lead Game Designer at **Ubisoft** (`Organization`). Ubisoft has two `Workspaces`: "Assassin's Creed Team" and "Far Cry Team". João is an `ADMIN` `Member` of Ubisoft, invites a collaborator (`Invite` → `AcceptInvite` creates `User` + `Member` in a transaction), designs a quest in "Assassin's Creed Team", saves versions (DAG-validated, SHA-256 hashed), publishes the approved one (sets `activeHash`, status `APPROVED`). Live Assassin's Creed clients, carrying Ubisoft's `OrganizationApiKey`, hit `/missions/engine/:id/active` and receive the compiled `missionData` resolved to the published hash. João can also belong to another studio as a consultant — same `User`, different `Member`. **Treat every architectural decision through this persona — if it breaks for João, it breaks for the product.**

**Tenancy rules:**
- Every Prisma query (via `PrismaQueryBuilder`) **must** filter by `organizationId`.
- Workspace-scoped resources also carry `workspaceId`.
- Auth resolves the JWT `{ userId, memberId, organizationId, role }` from the current session; permissions come from `Membership`, never from `User` directly.
- **Controllers never read `organizationId`/`authorId`/`memberId` from body or query** — only from `req.user`. Body DTOs (`src/infra/http/[module]/dto/*.body.dto.ts`) must omit those fields.
- `findById` tenancy exceptions: `UserGateway.findById(id)` (User is global), `OrganizationGateway.findById(id)` (the org is the tenant), `ApiKeyGateway.findByHash(keyHash)` (globally-unique hash; the row carries `organizationId`).

## Stack

- **Runtime**: Node.js 24, TypeScript 5.7
- **Framework**: NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Build/Transform**: SWC (`@swc/core`)
- **ORM**: Prisma 7 (`@prisma/client`, generated at `generated/prisma/client`)
- **Database**: PostgreSQL
- **Auth**: `@nestjs/jwt` + `jsonwebtoken`, `bcrypt` for password hashing. `BcryptPasswordHashService` reads `BCRYPT_ROUNDS` directly in its constructor (default 12, minimum 10 — boot fails otherwise), mirroring the env-in-constructor pattern used by `JwtTokenServiceImpl`.
- **Validation**: `class-validator` + `class-transformer`
- **API docs**: `@nestjs/swagger`
- **Security**: `helmet`, `@nestjs/throttler` (see Rate limiting pattern below).
- **Testing**: Jest 30 + `ts-jest`, `supertest` (e2e)
- **Tooling**: ESLint 9, Prettier 3, commitlint + husky (conventional commits). Hooks in `.husky/` (`pre-commit` → `npm test`, `commit-msg` → `commitlint`). CI in `.github/workflows/ci.yml` (lint + build + tests + commitlint on PRs).
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

- **Soft delete**: tenant-scoped entities use `deletedAt`. `Invite` uses a status cycle (`PENDING → ACCEPTED | CANCELLED | EXPIRED`). `OrganizationApiKey` uses `revokedAt`. `MissionVersion` is immutable and never deleted.
- **Cascade on org delete**: `OrganizationDeleteUseCase` propagates inside a single `transactionManager.execute` to `Member.softDeleteByOrganization`, `Invite.cancelPendingByOrganization`, `OrganizationApiKey.revokeByOrganization`, `Mission.softDeleteByOrganization`, `Workspace.softDeleteByOrganization`. Children are soft-deleted before parents (mission → workspace). API keys are revoked in the same transaction, closing the Engine `x-api-key` path immediately. When a new tenant-scoped module lands, it **must** expose a `softDeleteByOrganization(orgId, trx?)` gateway method and be wired into this use case — otherwise the Engine/search surface will leak data from "deleted" orgs. `DialogueTree` has a Prisma model but no module yet; when the module is created, wire it here.
- **Transactions**: gateways that participate in coordinated writes accept `trx?: TransactionContext`. Use cases orchestrate via `transactionManager.execute(async (trx) => ...)`. Pass `{ isolationLevel: 'Serializable' }` as the second argument when the critical section depends on read-modify-write invariants (e.g. last-admin checks).
- **Domain events**: the entity accumulates events via `this.addEvent(event)`; the **use case** calls `entity.pullEvents()` and dispatches **after** persistence commits (or after `transactionManager.execute` returns). Never dispatch from inside the entity.
- **Commits**: conventional commits (commitlint + husky)
- **Testing**: Jest + SWC, `makeSut()` pattern with `jest.fn()`; entities tested without mocks, use cases mock gateways, facades mock use cases.
- **Validation**: `class-validator` on DTOs; Notification pattern in entities (collects all errors before throwing `EntityValidationError`).
- **Error shape (canonical)**: every 422 response — from the DTO `ValidationPipe` (via `exceptionFactory`) AND from `EntityValidationErrorFilter` — returns `{ statusCode: 422, error: 'Unprocessable Entity', message: ValidationError[] }` where `ValidationError = { field: string | null, message: string }`. This is the contract the frontend consumes. Any new filter must preserve it.
- **Errors**: `NotFoundError`, `BadLoginError`, `EntityValidationError`, `ForbiddenError`, `UnauthorizedError`, `TokenExpiredError`.
- **Guards**: `@UseGuards(AuthGuard, RolesGuard)` on the `@Controller`, `@Roles({ role: MemberRole.X })` per route (minimum level). See `.claude/rules/controllers.md`.
- **Rate limiting**: two named throttlers registered globally in `ThrottlerModule.forRoot` (`default`, `engine`). The global guard is `EngineThrottlerGuard extends ThrottlerGuard`, which overrides `getTracker()`: when the request carries `x-api-key`, it keys by `sha256(x-api-key)`; otherwise it falls back to the parent's IP-based tracker. This single guard covers both surfaces — no bespoke bucket code.
  - **Authenticated REST** (`/auth/*`, `/workspaces/*`, `/missions/*` etc.): uses the `default` throttler keyed by IP. Limit from `THROTTLE_LIMIT` (default 30/min). `/auth/login` and `/auth/register` carry a per-route `@Throttle({ default: { limit: 5, ttl: 60_000 } })` override to raise the cost of brute-force attempts.
  - **Engine M2M** (`/missions/engine/*`): carries `@SkipThrottle({ default: true })` so only the `engine` throttler applies, keyed by `sha256(x-api-key)` (studios behind NAT don't share a bucket). Limits from `ENGINE_THROTTLE_LIMIT` (default 600) and `ENGINE_THROTTLE_WINDOW_MS` (default 60_000). Storage is the framework's in-process store — at horizontal scale swap for `ThrottlerStorageRedisService`.
- **Engine `lastUsedAt` hot path**: `ValidateKeyUseCase` delegates persistence to `apiKeyRepository.recordUsage(apiKey)`. The repository reads `ENGINE_LAST_USED_THROTTLE_MS` (default 60_000) in its constructor and skips the UPDATE when `apiKey.lastUsedAt` is within that window. Throttle lives at the infra boundary (where the write happens), keeping the use case free of infrastructure config. Without this, every UE5 plugin request would fire a `SELECT + UPDATE` on `organization_api_keys`.
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
