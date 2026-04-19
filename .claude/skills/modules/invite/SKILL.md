---
name: invite
description: Invite module — email invitations with token-based acceptance, role-based invites, 7-day expiry, no duplicate pending.
user-invocable: true
argument-hint: “”
---

# Invite Module

**Purpose:** manage email invitations for new users to join an organization. An *Invite* is a tokenized invitation (email, role, status, 7-day expiry). Invites are created by admins, accepted publicly via token, or cancelled by admins. Unlike other modules, invites use a status cycle (PENDING → ACCEPTED | CANCELLED) instead of soft delete.

**Scope:** per-organization — every invite carries `organizationId`.

---

## Files

```
src/modules/invite/
├── domain/
│   ├── invite.entity.ts                 ← rich entity (accept, cancel, renewToken, isExpired), normalizes email in the constructor
│   └── validators/invite.validator.ts   ← class-validator (email, role, token, uuids)
├── event/
│   ├── invite-created.event.ts          ← emitted on Invite.create()
│   ├── invite-accepted.event.ts         ← emitted on invite.accept(userId)
│   └── invite-resent.event.ts           ← emitted on invite.renewToken(...)
├── gateway/invite.gateway.ts            ← interface; create/update accept optional trx; cancelPendingByOrganization supports cascade
├── repository/invite.repository.ts      ← Prisma impl, getClient(trx) in writes, normalizes email on findByEmailAndOrg
├── usecase/
│   ├── create-invite/                   ← blocks duplicate PENDING + 7d expiry + dispatches InviteCreatedEvent
│   ├── accept-invite/                   ← User+Member+Invite in ONE transaction, requires password, dispatches InviteAcceptedEvent
│   ├── cancel-invite/                   ← PENDING → CANCELLED
│   ├── list-invites/                    ← findByOrganization → toJSON[]
│   └── resend-invite/                   ← new token + extends expiry + dispatches InviteResentEvent
├── facade/
│   ├── invite.facade.ts                 ← default export InviteFacade
│   └── invite.facade.dto.ts
├── factory/facade.factory.ts            ← wires repos, services, transactionManager, eventDispatcher
└── __tests__/                           ← mirrors the layout
```

---

## Entity

```ts
class Invite extends BaseEntity {
  _email: string;               // normalized (trim + lowercase) in the constructor
  _role: MemberRole;            // ADMIN | DESIGNER | VIEWER
  _status: InviteStatus;        // PENDING | ACCEPTED | CANCELLED
  _token: string;               // secret; NEVER leaks via toJSON
  _organizationId: string;
  _invitedById: string;
  _expiresAt: Date;
  // does NOT use _deletedAt — status IS the lifecycle
}
```

`toJSON()` returns `{ id, email, role, status, organizationId, invitedById, expiresAt, createdAt, updatedAt }`. It **does not** include `token`, `active`, or `deletedAt`. To send the email invite link, read `invite.token` via the getter directly in the use case.

---

## Key rules

### 1. Status cycle (no soft delete)
Valid transitions from `PENDING`: `ACCEPTED` (via token) or `CANCELLED` (via admin). Once it leaves `PENDING`, it's terminal.

### 2. No duplicate PENDING invite for `(email, organizationId)`
`CreateInviteUseCase` checks `findByEmailAndOrg` (filtered to `status: PENDING`) before creating. An existing PENDING (even expired) rejects with `EntityValidationError`. CANCELLED or ACCEPTED invites do not block.

### 3. Email is normalized everywhere
`Invite.create` runs the email through `normalizeEmail()`. `InviteRepository.findByEmailAndOrg` also normalizes the input so lookup is case/whitespace insensitive.

### 4. 7-day expiry
`CreateInviteUseCase` and `ResendInviteUseCase` set `expiresAt = now + 7d`. The entity exposes `isExpired()`. `invite.accept(userId)` throws `ForbiddenError` if expired.

### 5. Cryptographically secure token
`InviteTokenService.generate()` returns 64+ hex chars (`crypto.randomBytes(32).toString('hex')`). Stored in clear (it's already a secret). Delivered via `/invites/accept?token=...`.

### 6. `AcceptInviteUseCase` is atomic and requires password
- `password` is **required** in the input.
- Before the transaction: if a `User` already exists for `invite.email`, the use case calls `passwordHashService.compare(input.password, user.password)` and throws `BadLoginError` on mismatch — this prevents account hijacking via the public accept flow.
- Inside the transaction: creates a new `User` if missing (hashing the password), creates `Member`, mutates `invite.accept(userId)` and `inviteGateway.update(invite, trx)`.
- After commit: pulls and dispatches `InviteAcceptedEvent`.

### 7. Events only fire after persistence
```ts
await this.transactionManager.execute(async (trx) => {
  // ... writes ...
  invite.accept(user.id);
  await this.inviteGateway.update(invite, trx);
});

if (this.eventDispatcher) {
  for (const event of invite.pullEvents()) {
    await this.eventDispatcher.dispatch(event);
  }
}
```

Same pattern in `ResendInviteUseCase`: `invite.renewToken(newToken, newExpiresAt)` → `await inviteGateway.update(invite)` → dispatch `InviteResentEvent`.

### 8. Token never leaks via toJSON
`ListInvitesUseCase` returns `invite.toJSON()` — safe. Where the token is needed (create, resend), the use case reads `invite.token` directly and returns it in the output DTO.

### 9. Cascade on organization delete
`InviteGateway.cancelPendingByOrganization(organizationId, trx?)` is called by `OrganizationDeleteUseCase` inside the delete transaction. PENDING invites become CANCELLED so stale links stop working when the org is tombstoned.

---

## Use cases

| Use case | Input → Output | Notes |
|---|---|---|
| `CreateInviteUseCase` | `{ email, role, organizationId, invitedById }` → `{ id, email, role, organizationId, token, expiresAt }` | rejects duplicate PENDING; dispatches `InviteCreatedEvent` |
| `AcceptInviteUseCase` | `{ token, name?, password }` → `{ userId, memberId, organizationId }` | transactional; verifies password for existing users; dispatches `InviteAcceptedEvent` |
| `CancelInviteUseCase` | `{ id, organizationId }` → `void` | PENDING → CANCELLED |
| `ListInvitesUseCase` | `{ organizationId }` → `object[]` | lists `toJSON` ordered by `createdAt desc` |
| `ResendInviteUseCase` | `{ id, organizationId }` → `void` | new token + extends expiry; dispatches `InviteResentEvent` |

---

## Errors thrown

| Error | When |
|---|---|
| `NotFoundError(id, Invite)` | `cancel`/`resend` cannot find the invite in the org; `accept` cannot find it by token |
| `ForbiddenError` | accept/cancel/renew on a non-PENDING invite; accept on expired invite |
| `BadLoginError` | `accept` with a password that doesn't match an existing user |
| `EntityValidationError` | invalid DTO; existing PENDING invite for `(email, org)` |

---

## Gateway

```ts
interface InviteGateway {
  findById(id: string, organizationId: string): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;                  // used by public accept
  findByEmailAndOrg(email: string, organizationId: string): Promise<Invite | null>;
  findByOrganization(organizationId: string): Promise<Invite[]>;
  create(invite: Invite, trx?: TransactionContext): Promise<void>;
  update(invite: Invite, trx?: TransactionContext): Promise<void>;
  cancelPendingByOrganization(organizationId: string, trx?: TransactionContext): Promise<void>;
}
```

---

## HTTP Routes

```
POST   /invites             @Roles({ role: MemberRole.ADMIN })
  Body: CreateInviteBodyDto { email, role } → invite output (includes token)

GET    /invites             @Roles({ role: MemberRole.ADMIN })
  → InviteDto[] (no token)

POST   /invites/accept      (public)
  Body: { token, name?, password } → { userId, memberId, organizationId }

DELETE /invites/:id         @Roles({ role: MemberRole.ADMIN })

POST   /invites/:id/resend  @Roles({ role: MemberRole.ADMIN })
```

All mutating bodies are concrete DTO classes under `src/infra/http/invite/dto/` with `class-validator` decorators — never `Pick<>`/`Omit<>`.

---

## Infra

- `src/infra/http/invite/invite.module.ts` — provides `InviteFacade` via factory.
- `src/infra/http/invite/invite.controller.ts` — REST at `/invites`. `POST /accept` is public; all other routes require `AuthGuard + RolesGuard`.
- `src/infra/http/invite/invite.service.ts` — thin adapter over `InviteFacade`.
- `InviteFacadeFactory.create(eventDispatcher?)` — dispatcher is optional. When supplied it's threaded into both `CreateInviteUseCase` and `ResendInviteUseCase` so domain events reach subscribers.

---

## Testing

- Entity tested pure: prop validation, email normalization, status transitions, event emission (create/accept/renewToken), `toJSON` shape (no token/active/deletedAt).
- Use cases mock gateways with `jest.fn()` and `transactionManager.execute: jest.fn(async (fn) => fn({ trx: true }))`.
- `AcceptInviteUseCase` spec covers: new-user vs existing-user flows, password mismatch → `BadLoginError`, `inviteGateway.update(invite, trx)` gets the trx, `InviteAcceptedEvent` dispatched after commit, expiry/invalid token errors.
- `ResendInviteUseCase` spec asserts dispatch order via `mock.invocationCallOrder` (`dispatch` > `update`) and that `InviteResentEvent` is emitted.
- Facade mocks each use case.

---

## Update this skill when you change the module

Per the MANDATORY rule in CLAUDE.md, update this file when you:
- add/rename a use case or route
- change a DTO, gateway signature, or `toJSON` shape
- alter expiry, status cycle, or duplicate rules
- add/remove a domain event
- touch token generation or validation
