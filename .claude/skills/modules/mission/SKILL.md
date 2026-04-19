---
name: mission
description: Mission module — entity/usecases/repository/facade for UE5 mission orchestration with DAG validation, SHA-256 versioning and publish workflow. Workspace-scoped.
user-invocable: true
argument-hint: “”
---

# Mission Module

**Purpose:** domain model for UE5 mission authoring. A *Mission* is a DAG of gameplay nodes (objectives, conditions, dialogues, cinematics, rewards) compiled into an immutable *MissionContract* identified by a SHA-256 *activeHash*. The UE5 runtime pulls the published contract via the `activeHash`.

**Scope:** multi-tenant — missions are **workspace-scoped** (Organization → Workspace → Mission). Every gateway call carries `organizationId`. The entity also holds `workspaceId` for workspace-level isolation.

---

## Files

```
src/modules/mission/
├── domain/
│   ├── mission.entity.ts                  ← rich entity (publish, updateMission, events)
│   ├── validators/mission.validator.ts    ← class-validator rules (create/update groups)
│   └── services/
│       ├── mission-hash.service.ts        ← SHA-256 hash of MissionContract
│       └── dag-validator.service.ts       ← tricolor DFS cycle + dead-end + unreachable
├── event/
│   ├── mission-created.event.ts
│   └── mission-published.event.ts
├── usecase/
│   ├── find-by-id/                        ← throws NotFoundError(id, Mission)
│   ├── create/
│   ├── update/
│   ├── save-version/                      ← needs FindByIdUseCase + MissionHashService
│   ├── publish/                           ← needs FindByIdUseCase + EventDispatcher
│   ├── list-versions/
│   └── get-active/
├── gateway/mission.gateway.ts             ← interface only, NO framework
├── repository/mission.repository.ts       ← Prisma impl, uses relation filter for multi-tenant
├── facade/
│   ├── mission.facade.ts                  ← default export class
│   └── mission.facade.dto.ts              ← pure interfaces + MissionDto + MissionFacadeInterface
├── factory/facade.factory.ts              ← composes all usecases; accepts optional EventDispatcher
├── types/mission.types.ts                 ← CanvasGraph, MissionContract, DAGValidationErrors
└── __tests__/                             ← mirrors module layout
```

---

## Key Rules

### 1. Rich domain — mutations live on the Entity
The entity owns its invariants. Use cases only orchestrate.

```ts
// ❌ WRONG — anemic, usecase bypassing entity rules
mission._name = input.name;
await repo.update(mission);

// ✅ CORRECT
const mission = await this.findByIdUseCase.execute({ id, organizationId });
mission.updateMission({ name: input.name, description: input.description });
await this.missionRepository.update(mission);
```

Entity methods: `Mission.create()` (static factory), `updateMission(props)`, `publish(hash)`, `changeName/Description/Status`. Every mutator validates the relevant group and throws `EntityValidationError` on failure.

### 2. Events: `addEvent()` in entity, `pullEvents()` in usecase after persistence

```ts
// entity
this.addEvent(new MissionPublishedEvent(id, hash, orgId));

// usecase — AFTER persistence commits
await this.missionRepository.update(mission);
if (this.eventDispatcher) {
  for (const event of mission.pullEvents()) {
    await this.eventDispatcher.dispatch(event);
  }
}
```

**Never** dispatch from inside the entity. If the DB write fails, events must not fire (dual-write bug).

### 3. `FindByIdUseCase` is the single point of "not found"
Gateway returns `Mission | null`. The `FindByIdUseCase` throws `new NotFoundError(id, Mission)`. Every other usecase that needs a mission **injects** `FindByIdUseCaseInterface` — never calls the gateway directly for lookup+throw.

### 4. Multi-tenant isolation is non-negotiable
- Gateway methods all receive `organizationId`.
- `update()` uses `updateMany({ where: { id, organizationId } })`.
- `MissionVersion` queries filter through the relation: `{ missionId, mission: { organizationId } }`.
- `saveVersion()` pre-checks that the mission belongs to the org before inserting.

### 5. Workspace-scoped
- The entity carries `workspaceId` (required, validated as UUID on create).
- The repository persists `workspaceId` on create and reads it back in `toDomainEntity`.
- The controller route is `workspaces/:workspaceId/missions` — the param is injected into the create payload.
- `workspaceId` is immutable on the entity (no setter, set only at creation).

### 6. DAG validation cannot infinite-loop
`DAGValidatorService.validate(graph, startNodeId?)` uses:
- **Tricolor DFS (WHITE/GRAY/BLACK) with explicit stack** → detects cycles without stack-overflow, terminates even on adversarial inputs.
- **Dangling-edge check** → edges referencing missing nodes.
- **Dead-end check** → leaves that aren't terminal node types (`Reward.Give`, `Flag.Set`, `Cinematic.Play`).
- **BFS reachability** → unreachable nodes from the provided `startNodeId`.

Returns `{ isValid, errors: DAGValidationError[] }` where each error has `{ nodeId, errorType, message }`.

### 7. DAG validation is server-side, not client-provided
`SaveVersionUseCase` injects `DAGValidatorService` and computes `isValid` and `validationErrors` from `graphData` **before** computing the hash. The frontend cannot override validation results — the usecase always validates server-side. This prevents invalid contracts from being published to the runtime.

```ts
// Inside SaveVersionUseCase
const validation = this.dagValidatorService.validate(input.graphData, startNodeId);
const contract = new MissionContract(input.missionData, input.graphData);
const hash = this.hashService.compute(contract);
await this.missionVersionRepository.create({
  missionId, hash, isValid: validation.isValid, validationErrors: validation.errors
});
```

### 8. Hash = identity of a version
`MissionHashService.compute(contract)` returns SHA-256 hex of `JSON.stringify(contract)`. Same content → same hash → runtime cache hit. Injected into `SaveVersionUseCase`.

### 9. Facade DTOs are pure interfaces
`mission.facade.dto.ts` never imports class-validator. Class-validator decorators only live in `usecase/**/*.usecase.dto.ts` (because controllers use those classes). Facade consumers get clean interfaces.

### 10. `active` field aligned with BaseEntity
The entity persists `active` on create and update. `toDomainEntity` reads `active` from the DB row. Soft-delete sets `deletedAt` + deactivates (`active = false`).

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{id, organizationId}` → `Mission` | throws `NotFoundError(id, Mission)` |
| `CreateUseCase` | `{id, name, description?, organizationId, workspaceId, authorId}` → `MissionDto` | id must be snake_case; rejects duplicates; dispatches `MissionCreatedEvent` |
| `UpdateUseCase` | `{id, organizationId, name?, description?}` → `void` | uses `mission.updateMission()` |
| `SaveVersionUseCase` | `{missionId, organizationId, authorId, graphData, missionData}` → `{id, missionId, hash, isValid, validationErrors, ...}` | computes SHA-256 hash; validates DAG server-side |
| `PublishUseCase` | `{missionId, organizationId, versionHash}` → `{id, name, status, activeHash, updatedAt}` | rejects invalid versions; dispatches `MissionPublishedEvent` |
| `ListVersionsUseCase` | `{missionId, organizationId, page?=1, perPage?=20}` → `SearchResult<MissionVersionSummaryDto>` | |
| `GetActiveUseCase` | `{missionId, organizationId}` → `MissionContract` | throws if no active version |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Mission)` | mission missing in org |
| `NotFoundError(hash, {name:'MissionVersion'})` | version row missing |
| `NotFoundError(id, {name:'MissionActiveVersion'})` | mission exists but `activeHash` is null |
| `EntityValidationError` | invalid DTO, duplicate id on create, publishing an invalid version |

---

## Infra wiring

- `src/infra/http/mission/mission.module.ts` — `MissionModule` exports `MissionService` and provides `MissionFacade` via factory.
- `src/infra/http/mission/mission.controller.ts` — REST surface at `workspaces/:workspaceId/missions`. Guarded by `AuthGuard + RolesGuard`.
  - `POST /` (create) — requires `DESIGNER`, extracts `workspaceId` from route param. `@Body() CreateMissionBodyDto` (id snake_case + name + description?).
  - `POST /:id/versions` (saveVersion) — requires `DESIGNER`. `@Body() SaveVersionBodyDto` (graphData + missionData).
  - `PUT /:id/publish` — requires `DESIGNER`. `@Body() PublishMissionBodyDto` (versionHash: 64-char sha256 hex).
  - `GET /:id/versions` (listVersions) — requires `VIEWER`.
  - `GET /:id/active` (getActive) — requires `VIEWER`.

### Body DTOs (dedicated, not reused from use case)

Under `src/infra/http/mission/dto/`:
- `create-mission.body.dto.ts` — `CreateMissionBodyDto { id, name, description? }`. `organizationId`, `workspaceId` and `authorId` come from JWT/route param, **never** from body.
- `save-version.body.dto.ts` — `SaveVersionBodyDto { graphData: CanvasGraph, missionData: MissionContract }`. `missionId`, `organizationId`, `authorId` injected by the controller.
- `publish-mission.body.dto.ts` — `PublishMissionBodyDto { versionHash }` (64-char SHA-256 hex enforced via `@Length(64, 64)`).

This replaces the previous (wrong) pattern where controllers reused `*UseCaseInputDto` classes carrying server-only fields like `organizationId`/`authorId` — the `ValidationPipe` `whitelist` silently stripped those on accident, leaving clients free to poke at undefined surface. The dedicated body DTOs make the request surface explicit and auditable in Swagger.
- `src/infra/http/mission/mission.service.ts` — thin adapter delegating to `MissionFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module structure.
- Domain entity + validator + services tested **without mocks** (pure domain).
- Use cases mocked at Gateway boundary via `jest.fn()` using the `makeSut()` pattern.
- Facade mocked at each UseCase boundary.
- DAG validator specs include: simple cycle, self-loop, deep cycle, dangling edge, dead-end, terminal-node allowed, unreachable node.
- `EventDispatcher` mocked in Create/Publish specs to assert events fire **only after** `repository.create/update` resolves.
- All test factories include `workspaceId` as a required UUID field.
- Current coverage: 32 suites, 141 tests, all green.

---

## Open items (not yet in the module)

- No `DeleteUseCase` yet (soft delete via `mission.delete()` is on the entity).
- No integration tests under `test/integration/mission/`.

---

## Update this skill when you change the module

Per CLAUDE.md's MANDATORY rule, update this file whenever you:
- add/rename a use case or route
- change DTO shape or validators
- add/remove domain services or events
- touch multi-tenant filtering in the repository
- change facade method signatures
