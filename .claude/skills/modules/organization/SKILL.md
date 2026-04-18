---
name: organization
description: Organization module — tenant (studio) management, slug-based uniqueness, profile updates. Multi-tenant boundary.
user-invocable: true
argument-hint: ""
---

# Organization Module

**Purpose:** model a tenant organization (e.g., CD Projekt, Ubisoft). An *Organization* is the top-level isolation boundary. It owns Workspaces, Missions, and an invite/membership system. Every query against organization-owned resources **must** filter by `organizationId`.

**Scope:** global — organizations are created during user registration (RegisterUseCase) and can be updated/deleted by admins.

---

## Files

```
src/modules/organization/
├── domain/
│   ├── organization.entity.ts              ← rich entity (slug validation, soft delete)
│   ├── validators/organization.validator.ts ← class-validator (name, slug)
│   └── organization.types.ts               ← OrganizationSlug type (branded string)
├── gateway/organization.gateway.ts         ← interface only, no framework
├── repository/organization.repository.ts   ← Prisma impl, slug uniqueness checked at DB level
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, Organization)
│   ├── find-by-slug/                       ← returns Organization | null
│   ├── update/                             ← validates slug uniqueness
│   └── delete/                             ← soft delete (sets deletedAt)
├── facade/
│   ├── organization.facade.ts              ← default export class OrganizationFacade
│   └── organization.facade.dto.ts          ← pure interfaces + OrganizationDto + OrganizationFacadeInterface
├── factory/facade.factory.ts               ← composes all usecases
└── __tests__/                              ← mirrors module layout
```

---

## Entity Fields

```ts
class OrganizationEntity extends BaseEntity {
  _id: string;                    // UUID
  _name: string;                  // 2-255 chars
  _slug: string;                  // unique, lowercase+hyphens, 3-63 chars
  _avatarUrl: string | null;      // optional
  _deletedAt: Date | null;        // soft delete
}
```

---

## Key Rules

### 1. Rich domain — mutations live on the Entity
The entity owns slug validation and uniqueness checks.

```ts
// ❌ WRONG — anemic
organization._name = input.name;
organization._slug = input.slug;

// ✅ CORRECT
organization.updateProfile({
  name: input.name,
  slug: input.slug,
  avatarUrl: input.avatarUrl
});
```

### 2. Slug is unique, immutable after creation
- Format: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (lowercase alphanumeric + hyphens, no leading/trailing hyphens)
- Length: 3-63 characters
- **Immutable**: once set at creation, cannot change (even in update)
- Uniqueness is enforced at the DB level (unique index) **and** in the `UpdateUseCase` validator

```ts
// UpdateUseCase validates: slug in input → throw EntityValidationError
if (input.slug && input.slug !== organization._slug) {
  throw new EntityValidationError('Slug is immutable');
}
```

### 3. Registration creates Organization with auto-slug
`RegisterUseCase` generates an initial slug from the user's email domain:

```ts
// user email: alice@acme-games.com
// generated slug: acme-games (strip .com, lowercase, replace _ with -)
const slug = email
  .split('@')[1]
  .replace(/\.[a-z]+$/, '')
  .toLowerCase()
  .replace(/_/g, '-');
```

The user can later `UpdateUseCase` to customize the slug (one-time), but **cannot change it again** after that.

### 4. FindByIdUseCase and FindBySlugUseCase are the single points of lookup
- `FindByIdUseCase` throws `NotFoundError(id, Organization)` on missing org
- `FindBySlugUseCase` returns `Organization | null` (for public profile routes, if any)

### 5. UpdateUseCase revalidates slug uniqueness
Because the DB uniqueness index only applies to non-deleted rows, the gateway must:
1. Accept a `{name?, slug?, avatarUrl?}` input
2. If `slug` is provided and differs from current slug, reject with `EntityValidationError('Slug is immutable')`
3. Validate name/avatarUrl
4. Call `repository.update()`

### 6. Soft delete via BaseEntity
`DeleteUseCase` calls `organization.delete()`, which sets `_deletedAt` and calls `deactivate()`. The repository filters `{ deletedAt: null }` on all reads.

### 7. Facade DTOs are pure interfaces
`organization.facade.dto.ts` never imports class-validator. Class-validator is only in `usecase/**/*.usecase.dto.ts`.

### 8. Multi-tenant scope
Organization is **not** scoped by a parent — it IS the tenant boundary. Queries for org resources must always include `organizationId`. The gateway methods take `organizationId` and filter by it.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{id, organizationId}` → `Organization` | throws `NotFoundError(id, Organization)` |
| `FindBySlugUseCase` | `{slug}` → `Organization \| null` | global scan (no org filter) |
| `UpdateUseCase` | `{id, organizationId, name?, avatarUrl?}` → `void` | slug immutable; cannot be in input |
| `DeleteUseCase` | `{id, organizationId}` → `void` | soft delete |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Organization)` | org missing (findById only) |
| `EntityValidationError` | invalid DTO (name length, slug format), slug in update input |

---

## Facade interface

```ts
interface OrganizationFacadeInterface {
  findById(input): Promise<OrganizationDto>;
  findBySlug(input): Promise<OrganizationDto | null>;
  update(input): Promise<void>;
  delete(input): Promise<void>;
}
```

---

## HTTP Routes

```
GET /organizations (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization'}))
  Returns: current user's organization (resolved from JWT memberId → membership.organizationId)

PATCH /organizations (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization', minAdmin: true}))
  Input: UpdateInput { name?, avatarUrl? }
  Output: void

DELETE /organizations (@UseGuards(AuthGuard, RolesGuard), @Role({context: 'organization', minAdmin: true}))
  Output: void
```

No public routes for org lookup by slug — that's for internal use and future public profiles.

---

## Infra wiring

- `src/infra/http/organization/organization.module.ts` — provides `OrganizationFacade` via factory.
- `src/infra/http/organization/organization.controller.ts` — REST surface at `/organizations`. Guarded by `AuthGuard + RolesGuard`.
  - `GET /` (getCurrentOrg) — any authenticated user
  - `PATCH /` (update) — `ADMIN` or above
  - `DELETE /` (delete) — `ADMIN` or above
- `src/infra/http/organization/organization.service.ts` — thin adapter delegating to `OrganizationFacade`.

---

## Testing conventions

- `__tests__/` mirrors the module structure.
- Domain entity + validator tested **without mocks** (pure domain).
- Use cases mocked at Gateway boundary via `jest.fn()` using `makeSut()`.
- Facade mocked at each UseCase boundary.
- `UpdateUseCase` spec verifies slug immutability: attempting to change slug throws `EntityValidationError`.
- `DeleteUseCase` spec verifies soft delete: `_deletedAt` is set, entity is deactivated.
- Current coverage: **In Development**.

---

## Update this skill when you change the module

Per CLAUDE.md's MANDATORY rule, update this file whenever you:
- add/rename a use case or route
- change DTO shape or validators
- change slug validation rules
- add/remove domain services
- change facade method signatures
