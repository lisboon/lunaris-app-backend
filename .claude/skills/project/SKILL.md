---
name: project
description: lunaris-app-backend Architecture and Patterns Guide
user-invocable: true
argument-hint: “”
---

# lunaris-app-backend — Architecture and Patterns Guide

You are a specialist assistant on this project. Use this knowledge to generate code that is consistent with existing standards.

---

## Architecture

The project follows **DDD (Domain-Driven Design)** with **Clean Architecture / Hexagonal**:

- **Domain Layer** (`src/modules/`) — Pure business rules, with no framework dependencies
- **Infrastructure Layer** (`src/infra/`) — External adapters (HTTP, database, notifications)
- **Dependency Direction**: Infra → Modules (never the other way around)

---

## Domain Model (Multi-Tenant B2B)

Slack/Linear-style multi-tenancy for AAA game studios:

| Entity | Role | Scope |
|---|---|---|
| `Organization` | Tenant (studio). Top-level isolation boundary. | Global |
| `Workspace` | Project/team inside an Organization. Owns missions and game logic. | Per-Organization |
| `User` | Real person. | Global (may belong to many orgs) |
| `Membership` | `User × Organization` link with role/permissions (RBAC). | Per-Organization |

**Rules:**
- Every Prisma query must filter by `organizationId`.
- Workspace-scoped resources carry `workspaceId` too.
- Permissions resolve from `Membership`, never from `User` directly.
- "Account" is deprecated as a domain name — use `Workspace`.

---

## Module Structure

Each feature strictly follows this pattern:

```
src/modules/[module]/
├── domain/                    # Entities and validators
│   └── [module].entity.ts
├── usecase/                   # Use cases
│   └── [operation]/
│       ├── [operation].usecase.ts
│       └── [operation].usecase.dto.ts
├── repository/                # Repository implementations (Prisma)
│   └── [module].repository.ts
├── gateway/                   # Repository interfaces
│   └── [module].gateway.ts
├── facade/                    # Coordinator (interface + implementation)
│   └── [module].facade.ts
├── factory/                   # Dependency composition
│   └── [module].facade.factory.ts
├── event/                     # Domain events
│   └── [event].event.ts
└── service/                   # Shared services

src/infra/http/[module]/
├── [module].controller.ts     # HTTP endpoints
├── [module].service.ts        # NestJS adapter (thin layer)
└── [module].module.ts         # NestJS module
```

---

## Naming Conventions

### Files
| Type | Pattern|
|------|--------|
| Entity | `[name].entity.ts` |
| Use Case | `[operation].usecase.ts` |
| DTO | `[operation].usecase.dto.ts` |
| Gateway (interface) | `[name].gateway.ts` |
| Repository (impl) | `[name].repository.ts` |
| Facade | `[name].facade.ts` |
| Factory | `[name].facade.factory.ts` |
| Controller | `[name].controller.ts` |
| Service | `[name].service.ts` |
| Module | `[name].module.ts` |
| Test | `[name].spec.ts` |
| Event | `[name].event.ts` |
| Handler | `[name].handler.ts` |

### Classes
- **PascalCase** for classes: `UserEntity`, `PropertyFacade`, `LoginUseCase`
- **camelCase** for methods and variables
- **UPPER_SNAKE_CASE** for enums
- Required suffixes: `UseCase`, `Facade`, `Repository`, `Gateway`, `Service`, `Controller`, `Entity`

### DTOs
- Input interface: `{Action}InputDto`
- Output interface: `{Action}OutputDto`
- Input validator class: `{Action}Input` (with class-validator decorators)
- Output validator class: `{Action}Output`

---

## Database

- **ORM**: Prisma
- **Database**: PostgreSQL
- **Schema**: `prisma/schema.prisma`
- **Singleton instance**: `src/infra/database/prisma.instance.ts`
- **Transactions**: supported via `Prisma. TransactionClient` passed through the gateway
- **Vector DB**: **In Development** (for semantic search)

---

## Error Handling

### Domain Errors
- `BadLoginError` — Authentication failure
- `NotFoundError` — Resource not found
- `EntityValidationError` — Entity validation
- `ForbiddenError` — No authorization
- `UnauthorizedError` — Invalid token
- `TokenExpiredError` — Token expired

### Validation
- **DTOs**: `class-validator` + `class-transformer`
- **Entities**: Notification pattern (collects all errors before throwing)

### Canonical error shape on the wire

All 4xx domain errors serialize to the same JSON shape so the frontend can render field-level feedback uniformly:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Password must be between 8 and 128 characters" }
  ]
}
```

Two sources must emit this exact shape:
- `src/infra/http/shared/errors/exception-factory.ts` — handles `class-validator` DTO failures (422 via `ValidationPipe`). Recursively flattens nested `ValidationError` children into `{ field, message }` pairs using dot-notation paths.
- `src/infra/http/shared/errors/entity-validation.filter.ts` — handles `EntityValidationError` from entities (Notification pattern). The filter maps `notification.toJSON()` directly to `message[]`.

Any other filter that returns a different shape is a bug — fix the filter, don't add a second shape.

---

## Infrastructure

- **Cache**: `@nestjs/cache-manager` with `@CacheTTL()`
- **Queues**: BullMQ for asynchronous jobs
- **Storage**: **In Development** (for file uploads)
- **Images**: **In Development** (for image processing)
- **Email**: **In Development** (for email sending)
- **AI**: **In Development** (for AI integration)**
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Path Alias**: `@/*` → `./src/*`

---

## When Generating Code

1. **Always follow the module structure** described above
2. **Never import a framework into the domain layer** — the domain is pure
3. **Use the Factory pattern** for dependency composition
4. **DTOs with class-validator** in controllers, pure interfaces in use cases
5. **Repositories implement Gateways** — always define the interface first
6. **Entities extend BaseEntity** from `src/modules/@shared/`
7. **Domain events** — entity accumulates via `this.addEvent(event)`; Use Case dispatches via `entity.pullEvents()` **after** `await gateway.save()` commits. Never dispatch from inside the entity.
8. **Notification shape** — `notification.toJSON()` returns `ValidationError[]` = `{ field: string | null, message: string }[]`
9. **Pagination** — `SearchParams<Filter>` / `SearchResult<T>` from `@shared` use **camelCase** (`perPage`, `sortDir`, `currentPage`, `lastPage`)
10. **Tests use the makeSut pattern** with mocks via jest.fn()
11. **Domain errors** — use existing classes, never throw generic errors
12. **Guards in controllers** — always `@UseGuards(AuthGuard, RolesGuard)` + `@Role()`
13. **Body DTOs are dedicated classes** — `@Body()`, `@Query()` and `@Param()` bindings in controllers must be concrete classes living under `src/infra/http/[module]/dto/*.body.dto.ts` (or `*.query.dto.ts`). **Never** reuse `*UseCaseInputDto` classes as body types — they carry server-set fields (`organizationId`, `authorId`, `id`, …) that must come from the JWT / route param, never from the request body. The `ValidationPipe` runs with `whitelist: true`, which silently strips unknown keys — this protects you, but an explicit body DTO is the only auditable surface.
14. **Conventional commits** — the project uses commitlint
15. **env.example stays in sync** — every `process.env.X` added to the codebase must appear in `.env.example` with a short comment describing what reads it and whether a default exists.