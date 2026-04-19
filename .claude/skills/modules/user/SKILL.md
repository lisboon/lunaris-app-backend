---
name: user
description: User module — registration, login, identity management. Handles auth flows, JWT issuance, password hashing. Global user identity.
user-invocable: true
argument-hint: “”
---

# User Module

**Purpose:** manage user identity and authentication. A *User* is a real person (email, hashed password, name, avatar). Registration is atomic across User, Organization, and Membership. Login returns a JWT signed with `{ userId, memberId, organizationId, role }`.

**Scope:** global User (same person can join many organizations). Every User belongs to zero or more Organizations via Membership. Each membership carries role/permissions.

---

## Files

```
src/modules/user/
├── domain/
│   ├── user.entity.ts                      ← rich entity; email normalized in constructor and changeEmail; toJSON omits password
│   ├── validators/user.validator.ts        ← class-validator (email, name, password rules)
│   └── user.types.ts                       ← UserJwtPayload interface
├── gateway/user.gateway.ts                 ← interface only, no framework
├── repository/user.repository.ts           ← Prisma impl; findByEmail normalizes input
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, User)
│   ├── find-by-email/                      ← returns User | null
│   ├── register/                           ← atomic User+Organization+Member creation
│   └── login/                              ← signs JWT + returns user/org/role
├── facade/
│   ├── user.facade.ts                      ← default export class UserFacade
│   └── user.facade.dto.ts                  ← pure interfaces + UserDto + UserFacadeInterface
├── factory/facade.factory.ts               ← composes all use cases
└── __tests__/                              ← mirrors module layout
```

---

## Key rules

### 1. Rich domain — mutations live on the entity
The entity owns email normalization and password state. Use cases orchestrate, they don't mutate private fields.

```ts
// ❌ WRONG — anemic
user._email = input.email;

// ✅ CORRECT
const user = User.create({
  email: input.email,
  name: input.name,
  password: await passwordHashService.hash(input.password),
});
```

### 2. Password handling
- Password is required on create, never on update.
- Hashing is done by `BcryptPasswordHashService` (`bcrypt`). The shared `PasswordHashService` interface exposes `hash(plaintext)` and `compare(plaintext, hash)`.
- `toJSON()` **omits** `_password` so it can't leak via DTOs.
- `LoginUseCase` and `AcceptInviteUseCase` (existing-user branch) both verify via `passwordHashService.compare` and throw `BadLoginError` on mismatch.

### 3. Email normalization
`User.create` and `User#changeEmail` route the value through `normalizeEmail()` (trim + lowercase). `UserRepository.findByEmail` also normalizes the argument so lookups are case/whitespace insensitive.

### 4. `toJSON()` never leaks secrets
```ts
toJSON() {
  return {
    id: this._id,
    email: this._email,
    name: this._name,
    avatarUrl: this._avatarUrl,
    active: this._active,
    createdAt: this._createdAt,
    updatedAt: this._updatedAt,
    // password hash is intentionally omitted
  };
}
```

### 5. `RegisterUseCase` is atomic across User + Organization + Member
Orchestrates (in this order):
1. Reject duplicate `email` (`userGateway.findByEmail`) or `organizationSlug` (`organizationGateway.findBySlug`).
2. Hash the password.
3. Build `User`, `Organization`, and `Member` (role `ADMIN`) entities.
4. Persist all three inside `transactionManager.execute(async (trx) => ...)`.

If any write fails, the transaction rolls back — no partial state. The use case returns `{ user, organization, member }` **without** a JWT: registration is a separate concern from session issuance.

```ts
await this.transactionManager.execute(async (trx) => {
  await this.userGateway.create(user, trx);
  await this.organizationGateway.create(organization, trx);
  await this.memberGateway.create(member, trx);
});
```

### 6. `LoginUseCase` signs JWT with member context
- Takes `{ email, password }`
- Finds user by email (normalized)
- Verifies password via `passwordHashService.compare`
- Resolves the user's active `Member` (via `memberGateway.findByUserId`) — which now also filters out tombstoned organizations — or throws `BadLoginError` when none exist
- Calls `JwtTokenService.sign({ userId, memberId, organizationId, role })`
- Returns `{ accessToken, user, organization, role }`

JWT carries `memberId` so `AuthGuard` can hydrate role/org without a second DB lookup.

### 7. `FindByIdUseCase` and `FindByEmailUseCase` are the single points of lookup
- `FindByIdUseCase` throws `NotFoundError(id, User)` on missing user
- `FindByEmailUseCase` returns `User | null` (login logic decides when to throw)

### 8. Facade DTOs are pure interfaces
`user.facade.dto.ts` never imports `class-validator`. Use-case DTOs (`usecase/**/*.usecase.dto.ts`) own validation.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{ id }` → `User` | throws `NotFoundError(id, User)` |
| `FindByEmailUseCase` | `{ email }` → `User \| null` | used by login; normalizes email |
| `RegisterUseCase` | `{ email, name, password, organizationName, organizationSlug }` → `{ user, organization, member }` | atomic across 3 entities; no token issued |
| `LoginUseCase` | `{ email, password }` → `{ accessToken, user, organization, role }` | resolves active membership; throws `BadLoginError` on any failure |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, User)` | user missing (findById only) |
| `BadLoginError` | email not found, password mismatch, or no active memberships |
| `EntityValidationError` | invalid DTO (email format, password policy, name length, duplicate email/slug on register) |

---

## Facade interface

```ts
interface UserFacadeInterface {
  register(data: RegisterFacadeInputDto): Promise<RegisterFacadeOutputDto>;
  login(data: LoginFacadeInputDto): Promise<LoginFacadeOutputDto>;
  findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto>;
}
```

`RegisterFacadeOutputDto` = `{ user, organization, member }`; `LoginFacadeOutputDto` = `{ accessToken, user, organization, role }`.

---

## HTTP Routes

```
POST /auth/register (public)
  Body: RegisterBodyDto { email, name, password, organizationName, organizationSlug }
  Output: { user, organization, member }

POST /auth/login (public)
  Body: LoginBodyDto { email, password }
  Output: { accessToken, user, organization, role }

GET /auth/me (@UseGuards(AuthGuard))
  Output: CurrentUserDto (user + membership context from JWT)
```

`/auth/me` is **not** a use case — it's a controller route that reads the JWT payload from `req.user` and returns the authenticated view. All bodies are concrete DTO classes; no `Pick<>`/`Omit<>`.

---

## Infra wiring

- `src/infra/http/auth/auth.module.ts` — exports `AuthGuard`, `RolesGuard`, `EngineAuthGuard`, `UserFacade` (via `UserFacadeFactory`).
- `src/infra/http/auth/auth.controller.ts` — `POST /auth/register`, `POST /auth/login` (public); `GET /auth/me` (guarded).
- `src/infra/http/auth/auth.service.ts` — thin adapter to `UserFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module.
- Domain entity + validator tested **without mocks** (pure). Covers email normalization in constructor and `changeEmail`.
- Use cases mock gateways and `transactionManager` via `jest.fn()` and `makeSut()`.
- `RegisterUseCase` spec verifies: rejection on duplicate email/slug, atomicity (if one gateway throws, user is not persisted), and password is hashed.
- `LoginUseCase` spec covers all failure paths (missing user, bad password, no membership) — each throws `BadLoginError`.
- Current coverage: **In Development**.

---

## Update this skill when you change the module

Per the MANDATORY rule in CLAUDE.md, update this file when you:
- add/rename a use case or route
- change DTO shape or validators
- touch password hashing or JWT signing logic
- add/remove domain services
- change facade method signatures
