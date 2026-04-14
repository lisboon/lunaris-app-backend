# lunaris-app-backend

NestJS backend for a logic engine and mission orchestration (UE5). DDD + Clean Architecture.

## MANDATORY RULE: Keep Your Skills Up to Date

**After ANY interaction with the project** — Whether it’s reading code, editing files, creating use cases, fixing bugs, refactoring, answering questions, or any other task—**you MUST update the corresponding skill** in `.claude/skills/` with what you’ve learned.

This includes, but is not limited to:
- **New use cases, entities, or routes** created → add to the module's skill
- **Changes to DTOs or validations** → Update in the skill
- **New API endpoints** document it in the E module's skill in `/docs/api/insomnia.json`
- **New patterns or guards** → Update `project/SKILL.md`
- **Changes to business rules** → update `lunaris-business-rules`
- **New external integrations** → Update `integrations/SKILL.md`
- **Changes to the stack or dependencies** → Update `project/SKILL.md` and `lunaris-ecosystem`

**Skills are the lifeblood of the project. If they are out of date, all future interactions will be compromised.**

---

## Architecture

- **Modules Layer** (`src/modules/`) — Pure business logic, without a framework
- **Infra Layer** (`src/infra/`) — NestJS controllers, Prisma, external integrations
- **Dependency**: Infra → Modules (never the other way around)

## Stack

- **In Development**

## Conventions

- Files: `[name].entity.ts`, `[name].usecase.ts`, `[name].usecase.dto.ts`, `[name].gateway.ts`, `[name].repository.ts`, `[name].facade.ts`, `[name].facade.factory.ts`
- Class names: PascalCase with a suffix (`UserEntity`, `LoginUseCase`, `UserFacade`, `UserRepository`)
- DTOs: `{Action}InputDto` / `{Action}OutputDto` (interfaces), `{Action}Input` / `{Action}Output` (class validators)
- Enums: UPPER_SNAKE_CASE
- Path alias: `@/*` → `./src/*`

## Patterns

- **Soft delete**: all entities via `deletedAt`
- **Commits**: conventional commits (commitlint + husky)
- **Testing**: Jest + SWC, using the `makeSut()` pattern with mocks via `jest.fn()`
- **Validation**: class-validator in DTOs, Notification pattern in entities
- **Errors**: `NotFoundError`, `BadLoginError`, `EntityValidationError`, `ForbiddenError`, `UnauthorizedError`
- **Guards**: `@UseGuards(AuthGuard, RolesGuard)` + `@Role({ context, level, minAdmin })`
- **Pagination**: `SearchParams<Filter>` / `SearchResult<T>` from `@shared`


## Commands

```bash
npm run start        # SWC dev server
npm run dev          # Watch mode
npm run build        # Production build
npm run test         # Unit tests
npm run test:int     # Integration tests
npm run lint         # ESLint
npm run format       # Prettier
npm run command      # CLI tools
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