---
name: invite
description: Invite module — email invitations with token-based acceptance, role-based invites, 7-day expiry, no duplicate pending.
user-invocable: true
argument-hint: ""
---

# Invite Module

**Purpose:** manage email invitations for new users to join an organization. An *Invite* is a tokenized invitation (email, role, status, 7-day expiry). Invites are created by admins, accepted publicly por token, ou cancelled por admins. Diferente dos outros módulos, invites usam ciclo de status (PENDING → ACCEPTED | CANCELLED) em vez de soft delete.

**Scope:** per-organization — invites carregam `organizationId`.

---

## Files

```
src/modules/invite/
├── domain/
│   ├── invite.entity.ts                 ← rich entity (accept, cancel, renewToken, isExpired)
│   └── validators/invite.validator.ts   ← class-validator (email, role, token, uuids)
├── event/
│   ├── invite-created.event.ts          ← emitido em Invite.create()
│   └── invite-accepted.event.ts         ← emitido em invite.accept(userId)
├── gateway/invite.gateway.ts            ← interface; create/update aceitam trx opcional
├── repository/invite.repository.ts      ← Prisma impl, usa getClient(trx) em create/update
├── usecase/
│   ├── create-invite/                   ← valida sem PENDING duplicado + expiry 7d + dispatch InviteCreatedEvent
│   ├── accept-invite/                   ← User+Member+Invite em UMA transação, dispatch InviteAcceptedEvent
│   ├── cancel-invite/                   ← PENDING → CANCELLED
│   ├── list-invites/                    ← findByOrganization → toJSON[]
│   └── resend-invite/                   ← gera novo token + estende expiry
├── facade/
│   ├── invite.facade.ts                 ← default export InviteFacade
│   └── invite.facade.dto.ts
├── factory/facade.factory.ts            ← compõe repos, services, transactionManager, eventDispatcher
└── __tests__/                           ← espelha a estrutura
```

---

## Entity

```ts
class Invite extends BaseEntity {
  _email: string;
  _role: MemberRole;            // ADMIN | DESIGNER | VIEWER
  _status: InviteStatus;        // PENDING | ACCEPTED | CANCELLED
  _token: string;               // secret; NUNCA sai via toJSON
  _organizationId: string;
  _invitedById: string;
  _expiresAt: Date;
  // NÃO usa _deletedAt — status é o ciclo de vida
}
```

`toJSON()` retorna `{ id, email, role, status, organizationId, invitedById, expiresAt, createdAt, updatedAt }`. **Não** inclui `token`, `active` nem `deletedAt`. Para acesso ao token (fluxo de envio por email), use `invite.token` via getter.

---

## Regras-chave

### 1. Ciclo de status (sem soft delete)
Transições válidas a partir de `PENDING`: `ACCEPTED` (via token) ou `CANCELLED` (via admin). Após sair de `PENDING`, não há retorno.

### 2. Sem invite PENDING duplicado por `(email, organizationId)`
`CreateInviteUseCase` consulta `findByEmailAndOrg` (filtra `status: PENDING`) antes de criar. Se existir um PENDING (mesmo expirado), rejeita com `EntityValidationError`. Um invite CANCELLED ou ACCEPTED não bloqueia novos convites para o mesmo email.

### 3. Expiry de 7 dias
`CreateInviteUseCase` e `ResendInviteUseCase` setam `expiresAt = now + 7d`. Entity expõe `isExpired()`. `invite.accept(userId)` lança `ForbiddenError` se expirado.

### 4. Token criptograficamente seguro
`InviteTokenService.generate()` retorna 64+ chars hex (`crypto.randomBytes(32).toString('hex')`). Armazenado em claro (já é secret). Enviado ao convidado via link `/invites/accept?token=...`.

### 5. `AcceptInviteUseCase` é atômico
User + Member + Invite.update rodam dentro de `transactionManager.execute`. Se o invitee é usuário novo, cria `User`; senão reusa o existente. Sempre cria `Member`. `invite.accept(userId)` muda status para `ACCEPTED`. Dispara `InviteAcceptedEvent` **depois** da transação commitar.

### 6. Eventos só são despachados após persistir
```ts
// dentro do use case
await transactionManager.execute(async (trx) => {
  ...
  invite.accept(userId);
  await this.inviteGateway.update(invite, trx);
});

if (this.eventDispatcher) {
  for (const event of invite.pullEvents()) {
    await this.eventDispatcher.dispatch(event);
  }
}
```

### 7. Token não vaza por toJSON
`ListInvitesUseCase` retorna `invite.toJSON()` — seguro. Onde o token é necessário (create, resend), o use case lê `invite.token` diretamente e devolve no output DTO.

---

## Use cases

| Use case | Input → Output | Notas |
|---|---|---|
| `CreateInviteUseCase` | `{ email, role, organizationId, invitedById }` → `{ id, email, role, organizationId, token, expiresAt }` | rejeita PENDING duplicado; emite `InviteCreatedEvent` |
| `AcceptInviteUseCase` | `{ token, name?, password? }` → `{ userId, memberId, organizationId }` | transacional; emite `InviteAcceptedEvent` |
| `CancelInviteUseCase` | `{ id, organizationId }` → `void` | PENDING → CANCELLED |
| `ListInvitesUseCase` | `{ organizationId }` → `object[]` | lista toJSON ordenado por `createdAt desc` |
| `ResendInviteUseCase` | `{ id, organizationId }` → `void` | novo token + renova expiry |

---

## Erros possíveis

| Error | Quando |
|---|---|
| `NotFoundError(id, Invite)` | `cancel`/`resend` não achou invite no org; `accept` não achou por token |
| `ForbiddenError` | tentar accept/cancel/renew em invite não-PENDING; accept em invite expirado |
| `EntityValidationError` | DTO inválido; invite PENDING já existente para `(email, org)` |

---

## Gateway

```ts
interface InviteGateway {
  findById(id: string, organizationId: string): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;                  // usado pelo accept público
  findByEmailAndOrg(email: string, organizationId: string): Promise<Invite | null>;
  findByOrganization(organizationId: string): Promise<Invite[]>;
  create(invite: Invite, trx?: TransactionContext): Promise<void>;
  update(invite: Invite, trx?: TransactionContext): Promise<void>;
}
```

---

## HTTP Routes

```
POST /invites           @Roles({ role: MemberRole.ADMIN })
  Body: { email, role } → InviteDto (inclui token)

GET  /invites           @Roles({ role: MemberRole.ADMIN })
  → InviteDto[] (sem token)

POST /invites/accept    (pública)
  Body: { token, name?, password? } → { userId, memberId, organizationId }

DELETE /invites/:id     @Roles({ role: MemberRole.ADMIN })

POST /invites/:id/resend @Roles({ role: MemberRole.ADMIN })
```

---

## Infra

- `src/infra/http/invite/invite.module.ts` — provê `InviteFacade` via factory.
- `src/infra/http/invite/invite.controller.ts` — REST em `/invites`. `POST /accept` é público; demais rotas exigem `AuthGuard + RolesGuard`.
- `src/infra/http/invite/invite.service.ts` — adapter fino para `InviteFacade`.
- `InviteFacadeFactory.create(eventDispatcher?)` — dispatcher é opcional (sem dispatcher global wired ainda).

---

## Testing

- Entidade testada pura: validação de props, transições de status, emissão de eventos, formato do `toJSON` (não vaza token/active/deletedAt).
- Use cases mockam gateways via `jest.fn()` e mock de `transactionManager` com `execute: jest.fn((fn) => fn({ trx: true }))`.
- `AcceptInviteUseCase` valida: fluxo new-user vs existing-user, `inviteGateway.update` recebe o `trx`, `InviteAcceptedEvent` é despachado, expiry/token inválido erram corretamente.
- Facade mocka cada use case.

---

## Update this skill when you change the module

Conforme MANDATORY rule do CLAUDE.md, atualize este arquivo ao:
- adicionar/renomear use case ou rota
- mudar DTO, signature de gateway ou shape de `toJSON`
- alterar regra de expiry, ciclo de status ou duplicidade
- adicionar/remover evento de domínio
- mexer na geração ou validação de token
