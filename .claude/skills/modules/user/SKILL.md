---
name: user
description: User module — registration, login, identity management. Handles auth flows, JWT issuance, password hashing. Workspace-scoped credentials.
user-invocable: true
argument-hint: ""
---

# User Module

**Purpose:** manage user identity and authentication. A *User* is a real person (email, hashed password, name, avatar). Registration is atomic across User, Organization, and Membership. Login returns a JWT signed with {userId, memberId, organizationId, role}.

**Scope:** global User (same person can join many organizations). Every User belongs to zero or more Organizations via Membership. Each membership carries role/permissions.

---

## Files

```
src/modules/user/
├── domain/
│   ├── user.entity.ts                      ← rich entity (toJSON omits password)
│   ├── validators/user.validator.ts        ← class-validator (email, name, password rules)
│   └── user.types.ts                       ← UserJwtPayload interface
├── gateway/user.gateway.ts                 ← interface only, no framework
├── repository/user.repository.ts           ← Prisma impl
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, User)
│   ├── find-by-email/                      ← returns User | null
│   ├── register/                           ← atomic User+Organization+Membership creation
│   └── login/
├── facade/
│   ├── user.facade.ts                      ← default export class UserFacade
│   └── user.facade.dto.ts                  ← pure interfaces + UserDto + UserFacadeInterface
├── factory/facade.factory.ts               ← composes all usecases
└── __tests__/                              ← mirrors module layout
```

---

## Key Rules

### 1. Rich domain — mutations live on the Entity
The entity owns password hashing state. Use cases orchestrate.

```ts
// ❌ WRONG — anemic
user._passwordHash = hashedPassword;

// ✅ CORRECT
const user = UserEntity.create({
  email: input.email,
  name: input.name,
  passwordHash: await passwordHashService.hash(input.password)
});
```

### 2. Password handling
- Password is required on create, never on update.
- `PasswordHashService.hash(plaintext)` returns SHA-256 hex.
- `toJSON()` **omits** `_passwordHash` to prevent leakage.
- Login uses `PasswordHashService.verify(plaintext, hash)` for comparison.

### 3. `toJSON()` never leaks secrets
```ts
toJSON() {
  return {
    id: this._id,
    email: this._email,
    name: this._name,
    avatarUrl: this._avatarUrl,
    // password hash is intentionally omitted
  };
}
```

### 4. RegisterUseCase is atomic across User + Organization + Member
Registration creates:
- A new `User` entity
- A new `Organization` entity (with default name from user email domain)
- A new `Membership` linking User ↔ Organization with role `ADMIN`

Uses `TransactionManager` to ensure all-or-nothing semantics. If any step fails, the entire transaction rolls back.

```ts
// Inside RegisterUseCase
const [user, organization, membership] = await transactionManager.run(
  async (trx) => {
    const user = await this.userGateway.create(newUser, trx);
    const org = await this.organizationGateway.create(newOrg, trx);
    const member = await this.memberGateway.create(newMember, trx);
    return [user, org, member];
  }
);
```

### 5. LoginUseCase signs JWT with memberId context
- Takes `{email, password}`
- Finds user by email
- Verifies password
- Resolves the **first active Membership** (or throws `BadLoginError` if none exist)
- Calls `JwtTokenService.sign()` with `{userId, memberId, organizationId, role}`
- Returns `{accessToken, user, membership}`

JWT payload includes `memberId` so that the AuthGuard can resolve permissions without a second DB lookup.

### 6. FindByIdUseCase and FindByEmailUseCase are the single points of lookup
- `FindByIdUseCase` throws `NotFoundError(id, User)` on missing user
- `FindByEmailUseCase` returns `User | null` (login logic decides when to throw)

### 7. Facade DTOs are pure interfaces
`user.facade.dto.ts` never imports class-validator. Class-validator is only in `usecase/**/*.usecase.dto.ts`.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{id}` → `User` | throws `NotFoundError(id, User)` |
| `FindByEmailUseCase` | `{email}` → `User \| null` | used by LoginUseCase |
| `RegisterUseCase` | `{email, name, password}` → `{user, organization, membership, accessToken}` | atomic across 3 entities |
| `LoginUseCase` | `{email, password}` → `{accessToken, user, membership}` | finds first active membership; throws `BadLoginError` |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, User)` | user missing (findById only) |
| `BadLoginError` | email not found, password mismatch, or no active memberships |
| `EntityValidationError` | invalid DTO (email format, password required, name length) |

---

## Facade interface

```ts
interface UserFacadeInterface {
  findById(input): Promise<UserDto>;
  register(input): Promise<{ user, organization, membership, accessToken }>;
  login(input): Promise<{ accessToken, user, membership }>;
}
```

---

## HTTP Routes

```
POST /auth/register (public)
  Input: RegisterInput { email, name, password }
  Output: { user, organization, membership, accessToken }

POST /auth/login (public)
  Input: LoginInput { email, password }
  Output: { accessToken, user, membership }

GET /auth/me (@UseGuards(AuthGuard))
  Output: CurrentUserDto (user + membership context from JWT)
```

The `/auth/me` endpoint is **not** a usecase — it's a controller route that deserializes the JWT and returns the authenticated user from the request context.

---

## Infra wiring

- `src/infra/http/auth/auth.module.ts` — exports `AuthGuard`, `RolesGuard`, `EngineAuthGuard`, `UserFacade` (via `UserFacadeFactory`).
- `src/infra/http/auth/auth.controller.ts` — REST surface: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
  - `register` and `login` are public (no guards).
  - `/auth/me` is guarded by `AuthGuard` — extracts user/membership from JWT payload in request.
- `src/infra/http/auth/auth.service.ts` — thin adapter delegating to `UserFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module structure.
- Domain entity + validator tested **without mocks** (pure domain).
- Use cases mocked at Gateway boundary via `jest.fn()` using `makeSut()`.
- Facade mocked at each UseCase boundary.
- `RegisterUseCase` spec verifies atomic transaction: if `organizationGateway.create` throws, user is not created.
- `LoginUseCase` spec verifies password hashing vs. plaintext comparison; tests all error paths (missing user, bad password, no memberships).
- Current coverage: **In Development**.

---

## Update this skill when you change the module

Per CLAUDE.md's MANDATORY rule, update this file whenever you:
- add/rename a use case or route
- change DTO shape or validators
- touch password hashing or JWT signing logic
- add/remove domain services
- change facade method signatures
