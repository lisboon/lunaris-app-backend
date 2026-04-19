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
- **Domain errors**: use `NotFoundError`, `BadLoginError`, `EntityValidationError`, `ForbiddenError`, `UnauthorizedError`, `TokenExpiredError` — never throw generic errors
- **Events**: entity accumulates events via `this.addEvent(event)`. The **Use Case** reads them via `entity.pullEvents()` and dispatches **after** persistence commits. Never dispatch from inside the entity — that causes dual-write bugs (e.g. email sent but DB rolled back).
- **Email normalization**: entities and repositories that handle email must route it through `normalizeEmail()` from `@/modules/@shared/domain/utils/email` (trim + lowercase). Applies to constructors, `changeEmail`, and gateway lookups by email.

## Required module structure

```
src/modules/[module]/
├── domain/          → Entities ([name].entity.ts) + validators
├── usecase/         → Use cases ([action]/[action].usecase.ts + .usecase.dto.ts)
├── gateway/         → Repository interfaces ([name].gateway.ts) + filter ([name].filter.ts)
├── repository/      → Prisma implementation ([name].repository.ts) + query builder
├── facade/          → Coordinator ([name].facade.ts + .facade.dto.ts)
├── factory/         → Dependency composition (facade.factory.ts)
├── event/           → Domain events ([event].event.ts)
└── service/         → Shared services
```

## Use Case pattern

### Without transaction

```typescript
export class CreateWorkspaceUseCase implements CreateWorkspaceUseCaseInterface {
  constructor(
    private readonly gateway: WorkspaceGateway,
    private readonly eventDispatcher?: EventDispatcherInterface,
  ) {}

  async execute(input: CreateWorkspaceUseCaseInputDto): Promise<CreateWorkspaceUseCaseOutputDto> {
    const workspace = Workspace.create(input); // throws EntityValidationError if invalid
    await this.gateway.create(workspace);

    // dispatch events AFTER persistence
    if (this.eventDispatcher) {
      for (const event of workspace.pullEvents()) {
        await this.eventDispatcher.dispatch(event);
      }
    }

    return workspace.toJSON();
  }
}
```

### With transaction (coordinated writes)

```typescript
async execute(input: AcceptInviteUseCaseInputDto): Promise<AcceptInviteUseCaseOutputDto> {
  // ...lookups and guards outside the transaction

  await this.transactionManager.execute(async (trx) => {
    await this.userGateway.create(user, trx);
    await this.memberGateway.create(member, trx);
    invite.accept(user.id);
    await this.inviteGateway.update(invite, trx);
  });

  // events pulled AFTER the tx commits
  if (this.eventDispatcher) {
    for (const event of invite.pullEvents()) {
      await this.eventDispatcher.dispatch(event);
    }
  }
}
```

### Serializable isolation (read-modify-write invariants)

Pass `TransactionOptions` when the critical section must not see concurrent writes — e.g. last-admin checks:

```typescript
await this.transactionManager.execute(
  async (trx) => {
    const admins = await this.memberGateway.countAdmins(organizationId, trx);
    if (admins <= 1) throw new ForbiddenError('Cannot demote last admin');
    member.changeRole(newRole);
    await this.memberGateway.update(member, trx);
  },
  { isolationLevel: 'Serializable' },
);
```

## Gateway → Repository

```typescript
// Gateway (interface)
export interface WorkspaceGateway extends SearchableRepository<Workspace, WorkspaceFilter> {
  findById(id: string, organizationId: string): Promise<Workspace | null>;
  create(entity: Workspace, trx?: TransactionContext): Promise<void>;
  update(entity: Workspace, trx?: TransactionContext): Promise<void>;
}

// Repository (Prisma implementation)
export class WorkspaceRepository implements WorkspaceGateway { ... }
```

Gateways that participate in coordinated writes expose `trx?: TransactionContext` so the use case can thread the active Prisma transaction through.

## Facade + Factory

```typescript
export class WorkspaceFacade implements WorkspaceFacadeInterface {
  constructor(private readonly createUseCase: CreateWorkspaceUseCaseInterface, ...) {}
  async create(input: CreateWorkspaceFacadeInputDto) { return this.createUseCase.execute(input); }
}

export class WorkspaceFacadeFactory {
  static create(eventDispatcher?: EventDispatcherInterface): WorkspaceFacade {
    const repository = new WorkspaceRepository(prisma);
    return new WorkspaceFacade(new CreateWorkspaceUseCase(repository, eventDispatcher), ...);
  }
}
```

## DTOs

- Use case: `{Action}UseCaseInputDto` / `{Action}UseCaseOutputDto` + `{Action}UseCaseInterface`
- Facade: `{Action}FacadeInputDto` / `{Action}FacadeOutputDto` + `{Module}FacadeInterface`
- Classes double as type AND validator (`class-validator` decorators). Pure interfaces may be exported alongside the classes when they're useful for consumers.

## Pagination

- `SearchParams<Filter>` / `SearchResult<T>` from `@shared` — **camelCase** (`perPage`, `sortDir`, `currentPage`, `lastPage`)
- Soft delete via `deletedAt` on tenant-scoped entities. Cascade via dedicated gateway methods (e.g. `softDeleteByOrganization`, `cancelPendingByOrganization`) called inside the delete use case's transaction.

## Notification / ValidationError shape

`notification.toJSON()` returns `ValidationError[]` where each item is `{ field: string | null, message: string }`. `EntityValidationError` must accept this shape.
