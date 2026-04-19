---
name: member
description: Member module — User × Organization linking, role-based access control (RBAC), last-admin protection with Serializable isolation.
user-invocable: true
argument-hint: ""
---

# Member Module

**Purpose:** model the `User × Organization` relationship with role-based access control. A *Member* is a user's membership in an organization carrying a role (`ADMIN`, `DESIGNER`, `VIEWER`). Members are created during user registration (first member = ADMIN) and via invite acceptance.

**Scope:** per-organization — every member query must filter by `organizationId`.

---

## Files

```
src/modules/member/
├── domain/
│   ├── member.entity.ts                    ← rich entity (role, soft delete via BaseEntity)
│   ├── validators/member.validator.ts      ← class-validator (UUID, role enum)
│   └── member.types.ts                     ← re-exports MemberRole from @shared
├── gateway/member.gateway.ts               ← interface only, no framework
├── repository/member.repository.ts         ← Prisma impl, multi-tenant filtering
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, Member)
│   ├── find-by-user-and-org/               ← returns Member | null (user+org pair)
│   ├── list-by-organization/               ← pagination + filtering
│   ├── change-role/                        ← Serializable tx + last-admin protection
│   └── remove-member/                      ← Serializable tx + soft delete + last-admin protection
├── facade/
│   ├── member.facade.ts                    ← default export class MemberFacade
│   └── member.facade.dto.ts                ← pure interfaces + MemberDto + MemberFacadeInterface
├── factory/facade.factory.ts               ← composes all use cases
└── __tests__/                              ← mirrors module layout
```

---

## Entity

```ts
class Member extends BaseEntity {
  _userId: string;                // UUID, FK to User
  _organizationId: string;        // UUID, FK to Organization
  _role: MemberRole;              // ADMIN | DESIGNER | VIEWER
  // active / deletedAt inherited from BaseEntity
}

enum MemberRole {
  ADMIN = 'ADMIN',
  DESIGNER = 'DESIGNER',
  VIEWER = 'VIEWER',
}
```

---

## Key rules

### 1. Last-admin protection (read-modify-write, Serializable)
An organization **must** always have at least one active ADMIN. Both `ChangeRoleUseCase` and `RemoveMemberUseCase` run inside `transactionManager.execute(fn, { isolationLevel: 'Serializable' })` and re-count admins **inside** the transaction via `memberGateway.countAdmins(organizationId, trx)` before mutating. Serializable is the invariant — without it, two concurrent demotions can both pass the `count > 1` check and leave the org admin-less.

```ts
await this.transactionManager.execute(
  async (trx) => {
    const admins = await this.memberGateway.countAdmins(organizationId, trx);
    if (member.role === MemberRole.ADMIN && admins <= 1) {
      throw new ForbiddenError('Cannot remove last admin');
    }
    member.delete();
    await this.memberGateway.update(member, trx);
  },
  { isolationLevel: 'Serializable' },
);
```

`countAdmins` returns the count of active, non-deleted ADMINs scoped to the organization.

### 2. `FindByIdUseCase` and `FindByUserAndOrgUseCase` are the single points of lookup
- `FindByIdUseCase` throws `NotFoundError(id, Member)` on missing member
- `FindByUserAndOrgUseCase` returns `Member | null`

### 3. `findByUserId` ignores tombstoned orgs
`MemberRepository.findByUserId` filters `{ organization: { deletedAt: null } }` in addition to `active: true` and `deletedAt: null`. This is what prevents a deleted organization from locking a user's login: the query returns no member, `LoginUseCase` throws `BadLoginError`, and the user moves on.

### 4. Role is the permission source
The JWT payload carries `role` (resolved from membership at login). `RolesGuard` compares JWT role against the route's `@Roles({ role })`. Permissions are never read off `User`.

### 5. Multi-tenant isolation is non-negotiable
- Every use case takes `organizationId` and filters by it
- `update()` uses `updateMany({ where: { id, organizationId } })`
- Queries like `findByUserAndOrg()` include both keys

### 6. `ListByOrganizationUseCase` supports pagination
Returns `SearchResult<MemberDto>` with `items`, `total`, `currentPage`, `lastPage` (camelCase per `@shared` convention). Excludes soft-deleted rows.

### 7. Soft delete via BaseEntity (+ cascade hook)
`RemoveMemberUseCase` calls `member.delete()`, which sets `_deletedAt` and calls `deactivate()`. For cascading deletion of a whole org, the gateway exposes `softDeleteByOrganization(organizationId, trx?)` — called by `OrganizationDeleteUseCase` inside its transaction.

### 8. Facade DTOs are pure interfaces
`member.facade.dto.ts` never imports `class-validator`. Validation lives in `usecase/**/*.usecase.dto.ts`.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{ id, organizationId }` → `Member` | throws `NotFoundError(id, Member)` |
| `FindByUserAndOrgUseCase` | `{ userId, organizationId }` → `Member \| null` | used by login and membership checks |
| `ListByOrganizationUseCase` | `{ organizationId, page?=1, perPage?=20 }` → `SearchResult<MemberDto>` | paginated, excludes deleted |
| `ChangeRoleUseCase` | `{ id, organizationId, newRole }` → `void` | Serializable tx; last-admin guard; entity mutates via `changeRole()` |
| `RemoveMemberUseCase` | `{ id, organizationId }` → `void` | Serializable tx; soft delete; last-admin guard |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Member)` | member missing in org (findById only) |
| `ForbiddenError` | last-admin protection triggers (cannot demote/remove last admin) |
| `EntityValidationError` | invalid DTO (userId/organizationId not UUID, invalid role) |

---

## Gateway

```ts
interface MemberGateway {
  findById(id: string, organizationId: string): Promise<Member | null>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<Member | null>;
  findByUserId(userId: string): Promise<Member | null>;
  findByOrganization(organizationId: string): Promise<Member[]>;
  create(member: Member, trx?: TransactionContext): Promise<void>;
  update(member: Member, trx?: TransactionContext): Promise<void>;
  countAdmins(organizationId: string, trx?: TransactionContext): Promise<number>;
  softDeleteByOrganization(organizationId: string, trx?: TransactionContext): Promise<void>;
}
```

---

## Facade interface

```ts
interface MemberFacadeInterface {
  findById(input): Promise<MemberDto>;
  findByUserAndOrg(input): Promise<MemberDto | null>;
  listByOrganization(input): Promise<SearchResult<MemberDto>>;
  changeRole(input): Promise<void>;
  removeMember(input): Promise<void>;
}
```

---

## HTTP Routes

```
GET    /members              @Roles({ role: MemberRole.VIEWER })
  Query: { page?, perPage? }
  Output: SearchResult<MemberDto>

GET    /members/:id          @Roles({ role: MemberRole.VIEWER })
  Output: MemberDto

PATCH  /members/:id/role     @Roles({ role: MemberRole.ADMIN })
  Body: ChangeRoleBodyDto { role }
  Output: void

DELETE /members/:id          @Roles({ role: MemberRole.ADMIN })
  Output: void
```

All mutating bodies are concrete DTO classes under `src/infra/http/member/dto/` with `class-validator` decorators.

---

## Infra wiring

- `src/infra/http/member/member.module.ts` — provides `MemberFacade` via factory.
- `src/infra/http/member/member.controller.ts` — REST at `/members`. Guarded by `AuthGuard + RolesGuard`.
- `src/infra/http/member/member.service.ts` — thin adapter to `MemberFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module.
- Domain entity + validator tested **without mocks** (pure).
- Use cases mock `MemberGateway` and `TransactionManager` via `jest.fn()` and `makeSut()`.
- `ChangeRoleUseCase` and `RemoveMemberUseCase` specs assert:
  - demoting/removing the last ADMIN throws `ForbiddenError`
  - `transactionManager.execute` is called with `{ isolationLevel: 'Serializable' }`
- Coverage: **In Development**.

---

## Update this skill when you change the module

Per the MANDATORY rule in CLAUDE.md, update this file when you:
- add/rename a use case or route
- change DTO shape or validators
- change role enum or validation rules
- modify last-admin protection logic or isolation level
- add/remove domain services
- change facade method signatures
