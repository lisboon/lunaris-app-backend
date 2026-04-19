---
name: organization
description: Organization module — tenant (studio) management, slug-based uniqueness, profile updates, cascade soft-delete into members, pending invites, and API keys.
user-invocable: true
argument-hint: “”
---

# Organization Module

**Purpose:** model a tenant organization (e.g., CD Projekt, Ubisoft). An *Organization* is the top-level isolation boundary. It owns Workspaces, Missions, and an invite/membership system. Every query against organization-owned resources **must** filter by `organizationId`.

**Scope:** global — organizations are created during user registration (`RegisterUseCase`) and can be updated/deleted by admins.

---

## Files

```
src/modules/organization/
├── domain/
│   ├── organization.entity.ts              ← rich entity (slug validation, soft delete via BaseEntity)
│   ├── validators/organization.validator.ts ← class-validator (name, slug)
│   └── organization.types.ts               ← OrganizationSlug branded type
├── gateway/organization.gateway.ts         ← interface only, no framework; update accepts trx
├── repository/organization.repository.ts   ← Prisma impl, slug uniqueness at DB level
├── usecase/
│   ├── find-by-id/                         ← throws NotFoundError(id, Organization)
│   ├── find-by-slug/                       ← returns Organization | null
│   ├── update/                             ← validates slug immutability
│   └── delete/                             ← cascade soft-delete inside a transaction
├── facade/
│   ├── organization.facade.ts              ← default export class OrganizationFacade
│   └── organization.facade.dto.ts          ← pure interfaces + OrganizationDto + OrganizationFacadeInterface
├── factory/facade.factory.ts               ← composes all use cases
└── __tests__/                              ← mirrors module layout
```

---

## Entity

```ts
class Organization extends BaseEntity {
  _name: string;                  // 2–255 chars
  _slug: string;                  // unique, lowercase + hyphens, 3–63 chars
  _avatarUrl: string | null;      // optional
  // active / deletedAt inherited from BaseEntity
}
```

---

## Key rules

### 1. Rich domain — mutations live on the entity
```ts
// ❌ WRONG — anemic
organization._name = input.name;

// ✅ CORRECT
organization.updateProfile({ name: input.name, avatarUrl: input.avatarUrl });
```

### 2. Slug is unique and immutable after creation
- Format: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (lowercase alphanumeric + hyphens, no leading/trailing)
- Length: 3–63 chars
- **Immutable**: `UpdateUseCase` does not accept `slug` — the entity has no `changeSlug` method. The bug surface around slug changes simply doesn't exist.
- DB-level uniqueness index enforces global uniqueness at insert time.

### 3. Registration creates the organization with a client-supplied slug
`RegisterUseCase` receives `organizationName` and `organizationSlug` from the client and rejects duplicate slugs via `organizationGateway.findBySlug` before the transaction.

### 4. `FindByIdUseCase` and `FindBySlugUseCase` are the single points of lookup
- `FindByIdUseCase` throws `NotFoundError(id, Organization)` — note `Organization` is both a resource and the tenant, so the gateway takes only `id`.
- `FindBySlugUseCase` returns `Organization | null` (used for registration slug checks and future public profiles).

### 5. `DeleteUseCase` cascades inside a transaction
Deleting an organization is a tenant-wide tombstone. The use case composes:

```ts
async execute(input: { id }): Promise<void> {
  const organization = await this.findByIdUseCase.execute({ id: input.id });
  organization.delete();

  await this.transactionManager.execute(async (trx) => {
    await this.organizationGateway.update(organization, trx);
    await this.memberGateway.softDeleteByOrganization(input.id, trx);
    await this.inviteGateway.cancelPendingByOrganization(input.id, trx);
    await this.apiKeyGateway.revokeByOrganization(input.id, trx);
  });
}
```

This guarantees that, once the org row is soft-deleted, **atomically**:
- its members are soft-deleted,
- its PENDING invites are CANCELLED, and
- all of its active API keys are revoked (`revokedAt = now()`).

Combined with `MemberRepository.findByUserId` filtering out tombstoned orgs, users are not locked into a dead tenant after deletion, and the UE5 plugin can no longer serve `missionData` to a deleted tenant via a leaked key.

> ⚠️ Still tech debt: Workspaces and Missions of the org are **not** soft-deleted by this cascade (they remain readable inside the now-tombstoned org). See `memory/tech_debt_cascade_softdelete.md`.

### 6. Soft delete via BaseEntity
`Organization#delete()` sets `_deletedAt` and deactivates. The repository filters `{ deletedAt: null }` on all reads.

### 7. Facade DTOs are pure interfaces
`organization.facade.dto.ts` does not import `class-validator`. Validation lives in use case DTOs.

### 8. Multi-tenant scope
Organization is **not** scoped by a parent — it IS the tenant boundary. `OrganizationGateway.findById` takes only `id`. Other gateways take `(id, organizationId)`.

---

## Use cases

| Use case | Signature (input → output) | Notes |
|---|---|---|
| `FindByIdUseCase` | `{ id }` → `Organization` | throws `NotFoundError(id, Organization)` |
| `FindBySlugUseCase` | `{ slug }` → `Organization \| null` | global scan |
| `UpdateUseCase` | `{ id, name?, avatarUrl? }` → `void` | slug cannot be mutated (entity has no setter) |
| `DeleteUseCase` | `{ id }` → `void` | transactional cascade: org + members + pending invites + api keys |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Organization)` | org missing |
| `EntityValidationError` | invalid name/avatarUrl; duplicate slug at register time |

---

## Gateway

```ts
interface OrganizationGateway {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  create(org: Organization, trx?: TransactionContext): Promise<void>;
  update(org: Organization, trx?: TransactionContext): Promise<void>;
}
```

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
GET    /organizations        @Roles({ role: MemberRole.VIEWER })
  Returns the caller's current org (id resolved from JWT)

PATCH  /organizations        @Roles({ role: MemberRole.ADMIN })
  Body: UpdateOrganizationBodyDto { name?, avatarUrl? }
  Output: void

DELETE /organizations        @Roles({ role: MemberRole.ADMIN })
  Output: void
```

The `PATCH` body is a concrete DTO class under `src/infra/http/organization/dto/` with `class-validator` decorators — never `Pick<>`/`Omit<>` of a facade DTO (which would pull in `id` and let clients address other tenants).

---

## Infra wiring

- `src/infra/http/organization/organization.module.ts` — provides `OrganizationFacade` via factory.
- `src/infra/http/organization/organization.controller.ts` — REST at `/organizations`. `AuthGuard + RolesGuard`.
- `src/infra/http/organization/organization.service.ts` — thin adapter to `OrganizationFacade`.
- `OrganizationFacadeFactory.create()` wires `OrganizationRepository`, `MemberRepository`, `InviteRepository`, `ApiKeyRepository` (from the engine module) and `PrismaTransactionManager` into `DeleteUseCase`.

---

## Testing conventions

- `__tests__/` mirrors the module.
- Domain entity + validator tested **without mocks** (pure).
- `DeleteUseCase` spec asserts:
  - `organization.delete()` is called before any gateway write
  - `organizationGateway.update`, `memberGateway.softDeleteByOrganization`, `inviteGateway.cancelPendingByOrganization` **and** `apiKeyGateway.revokeByOrganization` all receive the same `trx`
  - api-key revocation happens **after** the org update (asserted via `mock.invocationCallOrder`) so that the write order matches the cascade intent
  - the whole thing runs inside a single `transactionManager.execute` call
- `UpdateUseCase` spec covers: name/avatarUrl updates persist, slug is not accepted as input.
- Coverage: **In Development**.

---

## Update this skill when you change the module

Per the MANDATORY rule in CLAUDE.md, update this file when you:
- add/rename a use case or route
- change DTO shape or validators
- change slug validation or cascade behaviour on delete
- add/remove dependencies in the facade factory
- change facade method signatures
