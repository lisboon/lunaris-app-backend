---
paths:
  - “src/modules/**/*.ts”
---

# Domain Layer — Rules

- **Pure domain**: never import NestJS, Prisma, or any framework here
- **Entities** extend `BaseEntity` from `src/modules/@shared/`
- **Validation**: Notification pattern (collects all errors before throwing)
- **Domain errors**: use `NotFoundError`, `BadLoginError`, `EntityValidationError`, `ForbiddenError`, `UnauthorizedError` — never throw generic errors
- **Events**: emit via `BaseEntity.emitEvent()`, synchronous handlers

## Required module structure

```
src/modules/[module]/
├── domain/          → Entities ([name].entity.ts)
├── usecase/         → Use cases ([operation].usecase.ts + [operation].usecase.dto.ts)
├── gateway/         → Repository interfaces ([name].gateway.ts)
├── repository/      → Prisma implementation ([name].repository.ts)
├── facade/          → Coordinator ([name].facade.ts)
├── factory/         → Dependency composition ([name].facade.factory.ts)
├── event/           → Domain events ([event].event.ts)
└── service/         → Shared services
```

## Use Case pattern

```typescript
export class CreateUserUseCase {
  constructor(private readonly gateway: UserGateway) {}
  async execute(input: CreateUserInputDto): Promise<CreateUserOutputDto> { ... }
}
```

## Gateway → Repository

```typescript
// Gateway (interface)
export interface UserGateway {
  create(entity: UserEntity): Promise<UserEntity>;
  search(params: SearchParams<UserFilter>): Promise<SearchResult<UserEntity>>;
}

// Repository (implementacao Prisma)
export class UserRepository implements UserGateway { ... }
```

## Facade + Factory

```typescript
export class UserFacade {
  constructor(private readonly createUseCase: CreateUserUseCase, ...) {}
  async create(input: CreateUserInputDto) { return this.createUseCase.execute(input); }
}

export class UserFacadeFactory {
  static create(): UserFacade {
    const prisma = PrismaInstance.getInstance();
    const repository = new UserRepository(prisma);
    return new UserFacade(new CreateUserUseCase(repository), ...);
  }
}
```

## DTOs

- Interface: `{Action}InputDto` / `{Action}OutputDto`
- Validator class: `{Action}Input` / `{Action}Output` (class-validator)

## Pagination

- `SearchParams<Filter>` / `SearchResult<T>` from `@shared`
- Soft delete via `deletedAt` on all entities