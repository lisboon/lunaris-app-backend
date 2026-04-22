<p align="center">
  <img src=".github/assets/lunaris-constellation-white.svg#gh-dark-mode-only" height="90">
  <img src=".github/assets/lunaris-constellation-mono.svg#gh-light-mode-only" height="90">
</p>

<h3 align="center">
  Lunaris<span style="color: #c8ec3f;">.</span>
</h3>

<p align="center">
  Design. Compile. Play.
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#api-reference"><strong>API Reference</strong></a> ·
  <a href="#ecosystem"><strong>Ecosystem</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a>
</p>

<br/>

## What is this?

`lunaris-app-backend` is the **Mission Orchestration Engine** behind [Lunaris](https://github.com/lisboon/lunaris-app-backend) — a multi-tenant B2B platform that lets AAA studios rebalance, patch, and ship quest logic without rebuilding the game binary.

It receives mission graphs authored on the Canvas editor, validates them against a strict DAG contract (no cycles, no dead-ends, no dangling edges), compiles each approved graph into an immutable versioned snapshot identified by a SHA-256 hash, and serves the active version to the Unreal Engine 5 plugin through an M2M REST API authenticated by per-organization API keys.

The model is tenant-isolated end-to-end: `User` × `Organization` × `Workspace` × `Mission` × `MissionVersion`. Studios cannot see each other's data; every query is scoped by `organizationId`.

## Ecosystem

| Repository | Role |
|------------|------|
| **lunaris-app-backend** ← you are here | Validator, compiler, versioning and REST API |
| [lunaris-app-frontend]() | React Flow canvas for Game Designers |
| [lunaris-app-unreal](https://github.com/lisboon/lunaris-app-plugin) | UE5 C++ plugin — consumes the compiled contract at runtime |

## Prerequisites

- Node.js **24+**
- npm **10+** (bundled with Node 24)
- PostgreSQL **15+**

## Quick Start

```bash
git clone https://github.com/lisboon/lunaris-app-backend.git
cd lunaris-app-backend

cp .env.example .env
# Required: DATABASE_URL, JWT_SECRET
# Optional: PORT (3001), JWT_EXPIRES_IN (7d), CORS_ORIGINS

npm install
npx prisma migrate dev
npm run start:dev
```

Server starts at `http://localhost:3001`. Swagger UI is available at `/docs`.

## API Reference

The full, up-to-date reference lives as an **Insomnia collection** at [`docs/api/insomnia.json`](./docs/api/insomnia.json) — import it to get every route, header, body shape and example response ready to fire.

The API is organized into three surfaces:

- **Auth** — signup (creates `User` + `Organization` atomically), login, session context. Issues a JWT carrying `{ userId, memberId, organizationId, role }`.
- **Orchestration** (`/workspaces`, `/missions`, `/missions/:id/versions`, `/invites`, `/members`, ...) — the authenticated surface consumed by the Canvas. Every write is scoped to the caller's organization and gated by `MemberRole` (`VIEWER < DESIGNER < ADMIN`).
- **Engine (M2M)** — `GET /missions/engine/:id/active` authenticated via `x-api-key`. This is what the UE5 plugin calls to fetch the compiled `missionData` resolved to the currently published version hash. Keys are generated under `/api-keys` and stored HMAC-hashed.

## Stack

- **Runtime** — Node.js 24, TypeScript 5.7
- **Framework** — NestJS 11 on Express
- **Build** — SWC
- **Persistence** — Prisma 7 + PostgreSQL
- **Auth** — `@nestjs/jwt`, `bcrypt`, per-organization HMAC-hashed API keys
- **Security** — Helmet, `@nestjs/throttler`, global `ValidationPipe` (whitelist + forbidNonWhitelisted)
- **Validation** — `class-validator` / `class-transformer`, Notification pattern in domain entities
- **Docs** — Swagger (`@nestjs/swagger`) + Insomnia collection
- **Testing** — Jest 30, `supertest` (e2e)
- **Tooling** — ESLint 9, Prettier 3, commitlint, husky

Architecture is **DDD + Clean**: pure domain under `src/modules/` (entities, use cases, gateways, facades), NestJS adapters and Prisma under `src/infra/`. The infra layer depends on modules — never the reverse.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, and [CLAUDE.md](./CLAUDE.md) for architecture conventions, naming rules and tenancy invariants you'll need to respect before opening a pull request.
