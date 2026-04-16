---
name: engine
description: Engine module — API Key management for the UE5 plugin. Per-organization key issuance, SHA-256 hash storage, revoke workflow, global validation gateway for the AuthGuard.
user-invocable: true
argument-hint: ""
---

# Engine Module

**Purpose:** issue, list, revoke and validate **API Keys** used by the Unreal Engine plugin to authenticate against Lunaris. The raw key is shown **once** at creation; only its SHA-256 hash is stored. The runtime AuthGuard exchanges the raw key (via `x-api-key` header) for an `organizationId` through the `validateKey` facade method.

**Scope:** multi-tenant — keys are scoped per `Organization`. Every gateway read/write except `findByHash` carries `organizationId`. `findByHash` is **global on purpose** (the hash is globally unique and the guard has no org yet) but returns the `ApiKey` entity with its own `organizationId` bound, so the caller can trust the tenant.

---

## Files

```
src/modules/engine/
├── domain/
│   ├── engine.entity.ts                    ← ApiKey rich entity (revoke, touchLastUsed)
│   ├── validators/engine.validator.ts      ← class-validator (create group)
│   └── services/engine-hash.service.ts     ← generate() + hash(); lnr_live_ prefix
├── gateway/engine.gateway.ts               ← interface only, no framework
├── repository/engine.repository.ts         ← Prisma impl, multi-tenant update via updateMany
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, ApiKey)
│   ├── create/                             ← hashes + persists, returns rawKey ONCE
│   ├── revoke/                             ← needs FindByIdUseCase; rejects already-revoked
│   ├── search/                             ← list all keys of the organization
│   └── validate-key/                       ← findByHash + touch lastUsedAt (used by AuthGuard)
├── facade/
│   ├── engine.facade.ts                    ← default export class ApiKeyFacade
│   └── engine.facade.dto.ts                ← pure interfaces + ApiKeyDto + ApiKeyFacadeInterface
├── factory/facade.factory.ts               ← composes all usecases
└── __tests__/                              ← mirrors module layout
```

**File-name convention:** files use the module prefix `engine.*` (matches workspace/mission). The domain class is `ApiKey` (semantic name — the domain concept is an API key, not an engine).

---

## Key Rules

### 1. Rich domain — mutations live on the Entity
`ApiKey.revoke()` sets `revokedAt` + calls `deactivate()` (which bumps `updatedAt`). `touchLastUsed(at?)` updates `lastUsedAt`. Use cases orchestrate; they never touch private fields.

```ts
// ❌ WRONG — anemic
apiKey._revokedAt = new Date();
await repo.update(apiKey);

// ✅ CORRECT
const apiKey = await findByIdUseCase.execute({ id, organizationId });
apiKey.revoke();
await repo.update(apiKey);
```

### 2. Secret is derived, stored as hash, shown once
`ApiKeyHashService.generate()` produces:
- `rawKey = "lnr_live_" + randomBytes(32).hex()` — returned to caller **exactly once** in `CreateUseCaseOutputDto.rawKey`
- `keyHash = sha256(rawKey)` — the only form persisted in DB
- `prefix = rawKey.substring(0, 12)` — for dashboard disambiguation (safe to store)

If the user loses the raw key they must create a new one. There is **no** recovery path.

### 3. Multi-tenant isolation is non-negotiable
- Every write/lookup for a specific key takes `organizationId` and filters by it.
- `update()` uses `updateMany({ where: { id, organizationId } })` — a wrong-org id is a no-op, never a silent cross-tenant write.
- `search()` returns only keys of the caller's organization.

### 4. `findByHash` is global but self-binding
The AuthGuard only has the raw `x-api-key` header — no org. `findByHash(keyHash)` scans the whole table (hash is globally unique), filtering out revoked/expired rows at the DB level. The returned `ApiKey` entity **carries its own `organizationId`**, which the guard then attaches to the request. Never let a consumer override `organizationId` after the fact.

### 5. `FindByIdUseCase` is the single point of "not found"
Gateway returns `ApiKey | null`. `FindByIdUseCase` throws `new NotFoundError(id, ApiKey)`. `RevokeUseCase` depends on `FindByIdUseCaseInterface` — it never calls the gateway directly for lookup+throw.

### 6. `ValidateKeyUseCase` follows the `PublishUseCase` shape
It is single-purpose: `findByHash → validate (revoked/expired) → touchLastUsed → await update → return {id, organizationId}`. `update` is **awaited**, not fire-and-forget — same rule as any other mutating use case.

### 7. Facade DTOs are pure interfaces
`engine.facade.dto.ts` never imports class-validator or swagger. `CreateUseCaseInputDto` in `usecase/create/create.usecase.dto.ts` is a class with `@ApiProperty` / `@ApiHideProperty` / `@IsUUID` decorators — controllers use `OmitType(CreateUseCaseInputDto, ['organizationId'])`.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{id, organizationId}` → `ApiKey` | throws `NotFoundError(id, ApiKey)` |
| `CreateUseCase` | `{name, organizationId, expiresAt?}` → `{id, name, prefix, rawKey, expiresAt, createdAt}` | **rawKey returned once**; entity validates (notification pattern) |
| `RevokeUseCase` | `{id, organizationId}` → `void` | throws `EntityValidationError` if already revoked |
| `SearchUseCase` | `{organizationId}` → `{items: SearchItemDto[], total}` | returns summaries (no `keyHash`) |
| `ValidateKeyUseCase` | `{rawKey}` → `{id, organizationId}` | used by `EngineAuthGuard`; touches `lastUsedAt`; throws `UnauthorizedError` for revoked/expired/missing |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, ApiKey)` | key missing in org (findById only) |
| `UnauthorizedError` | invalid / revoked / expired key on `validateKey` (mapped to HTTP 401 by `UnauthorizedErrorFilter`) |
| `EntityValidationError` | invalid DTO on create; revoking an already-revoked key |

---

## Facade interface

```ts
interface ApiKeyFacadeInterface {
  findById(input):   Promise<ApiKeyDto>;         // serializes via toJSON, omits keyHash
  create(input):     Promise<{ rawKey, ... }>;   // raw key shown once
  revoke(input):     Promise<void>;
  search(input):     Promise<{ items, total }>;
  validateKey(input): Promise<{ id, organizationId }>;
}
```

---

## Testing conventions

- `__tests__/` mirrors the module structure.
- Domain entity + validator + hash service tested **without mocks** (pure domain).
- Use cases mocked at Gateway boundary via `jest.fn()` using `makeSut()`.
- Facade mocked at each UseCase boundary.
- `ValidateKeyUseCase` spec asserts NotFound on (missing / revoked) cases and verifies `lastUsedAt` update path is called.
- Current coverage: 9 suites, 31 tests, all green.

---

## Infra wiring

- `src/infra/http/auth/auth.module.ts` — `AuthModule` exports `AuthGuard`, `RolesGuard`, `EngineAuthGuard`, `ApiKeyFacade` (provided via `ApiKeyFacadeFactory.create()`).
- `src/infra/http/auth/engine-auth-guard.ts` — injects `ApiKeyFacade` and calls `validateKey({ rawKey })`. The use case throws `UnauthorizedError` (from `@shared/domain/errors/unauthorized.error`) on missing/revoked/expired keys; the global `UnauthorizedErrorFilter` maps it to HTTP 401. Attaches `{ organizationId, apiKeyId }` to `request.engine`. **No direct Prisma access.**
- `src/infra/http/engine/engine-api-keys.controller.ts` — REST surface: `POST /api-keys` (create), `GET /api-keys` (search), `DELETE /api-keys/:id` (revoke). Guarded by `AuthGuard + RolesGuard`, requires `ADMIN` role.
- `src/infra/http/engine/engine.controller.ts` — `GET /missions/engine/:id/active`, guarded by `EngineAuthGuard`, delegates to `MissionService.getActive`.
- `EngineModule` imports `AuthModule` (for `EngineAuthGuard` + `ApiKeyFacade`) and `MissionModule` (for `MissionService`).

### 8. Repository reads `updatedAt` from DB
The `toEntity()` mapper now passes `row.updatedAt` to the entity constructor, keeping BaseEntity's `_updatedAt` in sync with the persisted value. Schema has `updatedAt @updatedAt` which auto-bumps on any mutation.

---

## Open items (not yet in the module)

- **Domain events** (`ApiKeyCreatedEvent`, `ApiKeyRevokedEvent`) — not emitted today. BaseEntity's `addEvent`/`pullEvents` plumbing is in place if/when auditing becomes a requirement.

---

## Update this skill when you change the module

Per CLAUDE.md's MANDATORY rule, update this file whenever you:
- add/rename a use case or route
- change DTO shape or validators
- add/remove domain services or events
- touch multi-tenant filtering in the repository
- change facade method signatures
- change the API-Key prefix (`lnr_live_`) or hash algorithm
