---
name: workspace
description: Workspace module — per-organization project/team container that owns missions and game logic. CRUD + paginated search, soft-delete, fully scoped by organizationId.
user-invocable: true
argument-hint: ""
---

# Workspace Module

**Purpose:** model a *Workspace* — a project/team inside an Organization (e.g. "Cyberpunk Team" under Ubisoft). Workspaces are the parent of Missions; they don't hold gameplay logic of their own, they're a scoping boundary.

**Scope:** per-Organization. Every gateway method (except construction) receives `organizationId` and filters by it. The entity persists `organizationId` as a required field.

---

## Files

```
src/modules/workspace/
├── domain/
│   ├── workspace.entity.ts                 ← rich entity (changeName, updateWorkspace, soft-delete via BaseEntity)
│   └── validators/workspace.validator.ts   ← class-validator (create/update groups)
├── gateway/
│   ├── workspace.gateway.ts                ← interface only, no framework
│   └── workspace.filter.ts                 ← WorkspaceSearchParams + filter shape
├── repository/
│   ├── workspace.repository.ts             ← Prisma impl; filters deletedAt: null + organizationId
│   └── workspace.query.builder.ts          ← shared SearchParams → Prisma where mapping
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, Workspace)
│   ├── create/                             ← rejects duplicate name in the same org
│   ├── search/                             ← paginated, scoped by organizationId
│   ├── update/                             ← uses FindByIdUseCase + entity.updateWorkspace
│   └── delete/                             ← soft-delete via entity.delete()
├── facade/
│   ├── workspace.facade.ts                 ← default export class WorkspaceFacade
│   └── workspace.facade.dto.ts             ← pure interfaces + WorkspaceDto + WorkspaceFacadeInterface
├── factory/facade.factory.ts               ← composes all use cases
└── __tests__/                              ← mirrors module layout
```

---

## Entity

```ts
class Workspace extends BaseEntity {
  _name: string;            // required, validated on create/update
  _organizationId: string;  // required UUID; set at creation and immutable
  // active / deletedAt inherited from BaseEntity
}
```

Mutators:
- `changeName(name)` — private-ish helper used by `updateWorkspace`.
- `updateWorkspace({ name? })` — bumps `updatedAt`, runs the `update` validation group, collects errors via the Notification pattern, throws `EntityValidationError` if any.
- `delete()` (from BaseEntity) — sets `deletedAt`, deactivates.

`organizationId` has **no setter** — a workspace cannot move between tenants.

---

## Key rules

### 1. Every gateway call carries `organizationId`
```ts
interface WorkspaceGateway {
  findById(id, organizationId)
  findByName(name, organizationId)
  create(workspace)            // organizationId already on the entity
  update(workspace)
  findAll(organizationId)
  search(params)               // params include organizationId in the filter
}
```
The repository's `update()` filters on `{ id, organizationId }` via `updateMany` — a wrong-org id is a no-op, never a silent cross-tenant write.

### 2. `FindByIdUseCase` is the single point of "not found"
Gateway returns `Workspace | null`; the use case throws `NotFoundError(id, Workspace)`. `UpdateUseCase` and `DeleteUseCase` inject `FindByIdUseCaseInterface` — they never call the gateway for lookup+throw.

### 3. Duplicate name check in `CreateUseCase`
Before persisting, the use case calls `findByName(name, organizationId)` and throws `EntityValidationError` with `{ field: 'name', message: 'Workspace already exists' }` if it finds a match. Names are unique **inside the organization** — different tenants can share the name "Cyberpunk Team".

### 4. Soft-delete via BaseEntity
`DeleteUseCase` fetches via `FindByIdUseCase`, calls `workspace.delete()`, persists. Repository reads filter `{ deletedAt: null }` so tombstoned workspaces drop out of every list. **Note (tech debt):** this soft-delete does **not** cascade into the workspace's missions yet — see `memory/tech_debt_cascade_softdelete.md`.

### 5. Facade DTOs are pure interfaces
`workspace.facade.dto.ts` never imports `class-validator`. Validation decorators live on `*UseCaseInputDto` classes under `usecase/*/` and on the controller's body DTOs under `src/infra/http/workspace/dto/`.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{id, organizationId}` → `Workspace` | throws `NotFoundError(id, Workspace)` |
| `CreateUseCase` | `{name, organizationId}` → `WorkspaceDto` | rejects duplicate name in the org |
| `SearchUseCase` | `WorkspaceSearchParams` (camelCase pagination) → `SearchResult<WorkspaceDto>` | scoped by `organizationId` |
| `UpdateUseCase` | `{id, organizationId, name?}` → `void` | uses `workspace.updateWorkspace()` |
| `DeleteUseCase` | `{id, organizationId}` → `void` | soft-delete via entity |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Workspace)` | workspace missing in the org |
| `EntityValidationError` | invalid name; duplicate name on create |

---

## Facade interface

```ts
interface WorkspaceFacadeInterface {
  findById(input): Promise<WorkspaceDto>;
  create(input): Promise<WorkspaceDto>;
  search(input): Promise<SearchResult<WorkspaceDto>>;
  update(input): Promise<void>;
  delete(input): Promise<void>;
}
```

---

## HTTP Routes

Base: `/workspaces`. All routes guarded by `AuthGuard + RolesGuard` and `@ApiBearerAuth()`.

```
POST   /workspaces             @Roles({ role: MemberRole.ADMIN })
  Body: CreateWorkspaceBodyDto { name }
  Output: WorkspaceDto

GET    /workspaces             @Roles({ role: MemberRole.VIEWER })
  Query: SearchWorkspacesQueryDto { name?, active?, sort?, sortDir?, page?, perPage? }
  Output: SearchResult<WorkspaceDto>

GET    /workspaces/:id         @Roles({ role: MemberRole.VIEWER })
  Output: WorkspaceDto

PATCH  /workspaces/:id         @Roles({ role: MemberRole.ADMIN })
  Body: UpdateWorkspaceBodyDto { name? }
  Output: void

DELETE /workspaces/:id         @Roles({ role: MemberRole.ADMIN })
  Output: 204 No Content
```

### Body / Query DTOs

Under `src/infra/http/workspace/dto/`:
- `create-workspace.body.dto.ts` — `CreateWorkspaceBodyDto { name }`. `organizationId` comes from the JWT, **never** from body.
- `update-workspace.body.dto.ts` — `UpdateWorkspaceBodyDto { name? }`.
- `search-workspaces.query.dto.ts` — `SearchWorkspacesQueryDto` with optional `name`, `active`, `sort`, `sortDir`, `page`, `perPage`. Pagination is **camelCase** (`perPage`, not `per_page` or `page_size`).

Controllers must **not** reuse `*UseCaseInputDto` as the body type — those carry server-set fields like `organizationId` which must come from the JWT.

---

## Infra wiring

- `src/infra/http/workspace/workspace.module.ts` — provides `WorkspaceFacade` via `WorkspaceFacadeFactory.create()`.
- `src/infra/http/workspace/workspace.controller.ts` — REST at `/workspaces`.
- `src/infra/http/workspace/workspace.service.ts` — thin adapter to `WorkspaceFacade`.
- `WorkspaceFacadeFactory.create()` wires `WorkspaceRepository` into all five use cases and composes `WorkspaceFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module structure.
- Domain entity + validator tested **without mocks** (pure domain).
- Use cases mocked at the Gateway boundary via `jest.fn()` using `makeSut()`.
- Facade spec mocks each use case at the method level and asserts delegation + `toJSON()` serialization where applicable.
- Pagination helpers covered in `search.usecase.spec.ts` (camelCase field names).

---

## Open items (not yet in the module)

- **Cascade soft-delete into missions** — deleting a workspace currently leaves its missions readable (tech debt, see memory).
- **Domain events** (`WorkspaceCreatedEvent`, `WorkspaceDeletedEvent`) — not emitted; plumbing available via BaseEntity when auditing is needed.

---

## Update this skill when you change the module

Per CLAUDE.md's MANDATORY rule, update this file whenever you:
- add/rename a use case or route
- change DTO shape or validators
- change the cascade behaviour on delete (e.g. add missions cascade)
- add/remove dependencies in the facade factory
- change facade method signatures
