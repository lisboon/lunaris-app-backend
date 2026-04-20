<p align="center">
  <img src="./assets/lunaris-constellation-white.svg#gh-dark-mode-only" height="90">
  <img src="./assets/lunaris-constellation-mono.svg#gh-light-mode-only" height="90">
</p>

<h3 align="center">
  Lunaris<span style="color: #c8ec3f;">.</span>
</h3>

# Contributing to Lunaris

Thank you for considering contributing to this project! By contributing, you help make this project better for everyone. Please take a moment to
review these guidelines to ensure a smooth contribution process. 

## Getting Started

### Prerequisites

To run the lunaris-app-backend locally, you will need:
- Node.js 24+
- PostgreSQL 16+
- Git

## Local Setup

```bash
# Clone the repository
git clone https://github.com/lisboon/lunaris-app-backend.git
cd lunaris-app-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# edit DATABASE_URL and JWT_SECRET

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run start:dev

```

Open http://localhost:3001/api-docs (Swagger UI).

## Running Checks

```
npm run test        # Unit tests
npm run lint        # Lint check
npm run build       # Type check + build
```

## How to Contribute

We follow a strict GitFlow model. The main branch is locked for production releases. ALL Pull Requests must target the develop branch.

### 1 -  Find an Issue
- Look for issues labeled good first issue or help wanted
- Comment on the issue to let others know you're working on it
- If you want to work on something not listed, open an issue first to discuss

### 2 -  Create a Branch

```
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Branch naming convention:

- feature/<description> — new functionality
- fix/<description> — bug fix
- docs/<description> — documentation
- refactor/<description> — code refactoring

### 3 - Write Code

Before writing code, read CLAUDE.md — it contains the architecture guide, naming conventions, and patterns.

### Key rules:

- Pure Domain by default: Never import @nestjs/* or @prisma/client inside src/modules/*/domain/
- Classes in PascalCase, files in kebab-case
- Never call Prisma directly from Use Cases — use typed methods in src/modules/*/gateway/
- Transactions follow the transactionManager.execute(async (trx) => ...) pattern
- Use the Notification pattern for entity validation (collect all errors before throwing)
- Tests must use the makeSut() factory pattern with jest.fn() mocks at the gateway boundary

### 4 - Commit

We use Conventional Commits:

```
feat: add DAG cycle detection via tricolor DFS
fix: prevent dual-write when accept transaction rolls back
docs: update node types table in README
refactor: extract Prisma queries to custom QueryBuilder
chore: bump prisma to 7.3.1
```

### 5. Open a Pull Request

- Target the develop branch
- Fill in the PR template completely
- Link the related issue
- Make sure CI passes (lint + test + build)

## Reporting Issues

- If you encounter a bug or have a feature request, please open an issue in the [Issues](https://github.com/lisboon/lunaris-app-backend/issues) section of this repository. Provide as much detail as possible to help us address the issue effectively.

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](./LICENSE).


#### Thank you for your contributions!

