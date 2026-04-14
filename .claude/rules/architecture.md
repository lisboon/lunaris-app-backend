---
paths:
  - "src/modules/**/*.ts"
---

# Domain Layer — Rules

## Domain Model (Multi-Tenant)

Lunaris is **multi-tenant B2B** (Slack/Linear-style). Core hierarchy:

- `Organization` — tenant (studio). Top-level isolation.
- `Workspace` — project/team inside an Organization (owns missions, game logic).
- `User` — global person.
- `Membership` — `User × Organization` link with role/permissions (RBAC).

**Every query must filter by `organizationId`.** Workspace-scoped resources also carry `workspaceId`. Permissions resolve from `Membership`, never from `User` directly.

## Layer rules

- **Pure domain**: never import NestJS, Prisma, or any framework here
- **Entities** extend `BaseEntity` from `src/modules/@shared/`
- **Validation**: Notification pattern (collects all errors before throwing)
- **Domain errors**: use `NotFoundError`, `BadLoginError`, `EntityValidationError`, `ForbiddenError`, `UnauthorizedError` — never throw generic errors
- **Events**: entity accumulates events via `this.addEvent(event)`. The **Use Case or Repository** reads them via `entity.pullEvents()` **after** persistence commits. Never dispatch from inside the entity — that causes dual-write bugs (e.g., email sent but DB rolled back).

## Required module structure

```
src/modules/[module]/
├── domain/          → Entities ([name].entity.ts) + validators
├── usecase/         → Use cases ([operation]/[operation].usecase.ts + .usecase.dto.ts)
├── gateway/         → Repository interfaces ([name].gateway.ts) + filter ([name].filter.ts)
├── repository/      → Prisma implementation ([name].repository.ts) + query builder
├── facade/          → Coordinator ([name].facade.ts + .facade.dto.ts)
├── factory/         → Dependency composition (facade.factory.ts)
├── event/           → Domain events ([event].event.ts)
└── service/         → Shared services
```

## Use Case pattern

```typescript
export class CreateWorkspaceUseCase implements CreateUseCaseInterface {
  constructor(private readonly gateway: WorkspaceGateway) {}
  async execute(input: CreateUseCaseInputDto): Promise<CreateUseCaseOutputDto> {
    const workspace = Workspace.create(input); // throws EntityValidationError if invalid
    await this.gateway.create(workspace);
    // dispatch events AFTER persistence
    for (const event of workspace.pullEvents()) {
      await this.eventDispatcher.dispatch(event);
    }
    return workspace.toJSON();
  }
}
```

## Gateway → Repository

```typescript
// Gateway (interface)
export interface WorkspaceGateway extends SearchableRepository<Workspace, WorkspaceFilter> {
  findById(id: string, organizationId: string): Promise<Workspace | null>;
  create(entity: Workspace): Promise<void>;
}

// Repository (Prisma implementation)
export class WorkspaceRepository implements WorkspaceGateway { ... }
```

## Facade + Factory

```typescript
export class WorkspaceFacade {
  constructor(private readonly createUseCase: CreateUseCaseInterface, ...) {}
  async create(input: CreateFacadeInputDto) { return this.createUseCase.execute(input); }
}

export class WorkspaceFacadeFactory {
  static create(): WorkspaceFacade {
    const repository = new WorkspaceRepository(prisma);
    return new WorkspaceFacade(new CreateUseCase(repository), ...);
  }
}
```

## DTOs

- Interface: `{Action}InputDto` / `{Action}OutputDto`
- Validator class: `{Action}Input` / `{Action}Output` (class-validator)

## Pagination

- `SearchParams<Filter>` / `SearchResult<T>` from `@shared` — **camelCase** (`perPage`, `sortDir`, `currentPage`, `lastPage`)
- Soft delete via `deletedAt` on all entities

## Notification / ValidationError shape

`notification.toJSON()` returns `ValidationError[]` where each item is `{ field: string | null, message: string }`. `EntityValidationError` must accept this shape.
