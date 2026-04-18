---
name: member
description: Member module — User × Organization linking, role-based access control (RBAC), last-admin protection.
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
│   ├── member.entity.ts                    ← rich entity (role, soft delete)
│   ├── validators/member.validator.ts      ← class-validator (UUID, role enum)
│   └── member.types.ts                     ← MemberRole enum (ADMIN, DESIGNER, VIEWER)
├── gateway/member.gateway.ts               ← interface only, no framework
├── repository/member.repository.ts         ← Prisma impl, multi-tenant filtering
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, Member)
│   ├── find-by-user-and-org/               ← returns Member | null (user+org pair)
│   ├── list-by-organization/               ← pagination + filtering
│   ├── change-role/                        ← validates last-admin protection
│   ├── remove-member/                      ← soft delete, validates last-admin
│   └── count-admins/                       ← internal service for last-admin checks
├── facade/
│   ├── member.facade.ts                    ← default export class MemberFacade
│   └── member.facade.dto.ts                ← pure interfaces + MemberDto + MemberFacadeInterface
├── factory/facade.factory.ts               ← composes all usecases
└── __tests__/                              ← mirrors module layout
```

---

## Entity Fields

```ts
class MemberEntity extends BaseEntity {
  _id: string;                    // UUID
  _userId: string;                // UUID, FK to User
  _organizationId: string;        // UUID, FK to Organization
  _role: MemberRole;              // ADMIN | DESIGNER | VIEWER
  _deletedAt: Date | null;        // soft delete
}

enum MemberRole {
  ADMIN = 'ADMIN',
  DESIGNER = 'DESIGNER',
  VIEWER = 'VIEWER'
}
```

---

## Key Rules

### 1. Last-Admin Protection
An organization **must** have at least one ADMIN member. Both `ChangeRoleUseCase` and `RemoveMemberUseCase` validate this:

```ts
// Inside ChangeRoleUseCase
if (currentMember.role === 'ADMIN' && newRole !== 'ADMIN') {
  const adminCount = await this.countAdminsUseCase.execute({ organizationId });
  if (adminCount <= 1) {
    throw new ForbiddenError('Cannot demote last admin');
  }
}

// Inside RemoveMemberUseCase
if (member.role === 'ADMIN') {
  const adminCount = await this.countAdminsUseCase.execute({ organizationId });
  if (adminCount <= 1) {
    throw new ForbiddenError('Cannot remove last admin');
  }
}
```

`CountAdminsUseCase` returns the **active, non-deleted** admin count in the organization.

### 2. FindByIdUseCase and FindByUserAndOrgUseCase are the single points of lookup
- `FindByIdUseCase` throws `NotFoundError(id, Member)` on missing member
- `FindByUserAndOrgUseCase` returns `Member | null` (used by login flow and membership queries)

### 3. Role is the permission source
The JWT payload carries `role` (resolved from membership at login). The `RolesGuard` (in infra) compares JWT role against route `@Role()` decorators. Members never check User for permissions — always resolve via Membership.

### 4. Multi-tenant isolation is non-negotiable
- Every usecase method receives `organizationId` and filters by it
- `update()` uses `updateMany({ where: { id, organizationId } })`
- Queries like `findByUserAndOrg()` include both `userId` and `organizationId` in the filter

### 5. ListByOrganizationUseCase supports pagination
Returns `SearchResult<MemberDto>` with:
- `items: MemberDto[]` — paginated list of members (excludes deleted)
- `total: number` — total active members in org
- `currentPage`, `lastPage` — pagination metadata

### 6. Soft delete via BaseEntity
`RemoveMemberUseCase` calls `member.delete()`, which sets `_deletedAt` and calls `deactivate()`. The repository filters `{ deletedAt: null }` on all reads.

### 7. Facade DTOs are pure interfaces
`member.facade.dto.ts` never imports class-validator. Class-validator is only in `usecase/**/*.usecase.dto.ts`.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{id, organizationId}` → `Member` | throws `NotFoundError(id, Member)` |
| `FindByUserAndOrgUseCase` | `{userId, organizationId}` → `Member \| null` | used by login, membership queries |
| `ListByOrganizationUseCase` | `{organizationId, page?=1, perPage?=20}` → `SearchResult<MemberDto>` | paginated, excludes deleted |
| `ChangeRoleUseCase` | `{id, organizationId, newRole}` → `void` | validates last-admin; entity mutates via `changeRole()` |
| `RemoveMemberUseCase` | `{id, organizationId}` → `void` | soft delete; validates last-admin |
| `CountAdminsUseCase` | `{organizationId}` → `number` | active admin count (internal use) |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Member)` | member missing in org (findById only) |
| `ForbiddenError` | last-admin protection triggered (cannot demote/remove last admin) |
| `EntityValidationError` | invalid DTO (userId/organizationId not UUID, invalid role) |

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
GET /members (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization'}))
  Query: { page?, perPage? }
  Output: SearchResult<MemberDto>

GET /members/:id (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization'}))
  Output: MemberDto

PATCH /members/:id/role (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization', minAdmin: true}))
  Input: ChangeRoleInput { newRole }
  Output: void

DELETE /members/:id (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization', minAdmin: true}))
  Output: void
```

---

## Infra wiring

- `src/infra/http/member/member.module.ts` — provides `MemberFacade` via factory.
- `src/infra/http/member/member.controller.ts` — REST surface at `/members`. Guarded by `AuthGuard + RolesGuard`.
  - `GET /` (list) — any authenticated user in org
  - `GET /:id` (getById) — any authenticated user in org
  - `PATCH /:id/role` (changeRole) — `ADMIN` or above
  - `DELETE /:id` (removeMember) — `ADMIN` or above
- `src/infra/http/member/member.service.ts` — thin adapter delegating to `MemberFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module structure.
- Domain entity + validator tested **without mocks** (pure domain).
- Use cases mocked at Gateway boundary via `jest.fn()` using `makeSut()`.
- Facade mocked at each UseCase boundary.
- `ChangeRoleUseCase` spec verifies last-admin protection: demoting last ADMIN throws `ForbiddenError`.
- `RemoveMemberUseCase` spec verifies last-admin protection: removing last ADMIN throws `ForbiddenError`.
- `CountAdminsUseCase` spec verifies count excludes deleted members and non-ADMIN roles.
- Current coverage: **In Development**.

---

## Update this skill when you change the module

Per CLAUDE.md's MANDATORY rule, update this file whenever you:
- add/rename a use case or route
- change DTO shape or validators
- change role enum or validation rules
- modify last-admin protection logic
- add/remove domain services
- change facade method signatures
