---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
---

# Tests — Rules

- **Framework**: Jest + SWC
- **Pattern**: `makeSut()` factory for setup
- **Mocks**: `jest.fn()` — only at I/O boundaries (gateways, use cases when tested from a facade)
- **No I/O**: unit tests never access the database, HTTP, or any external service
- **Location**: mirror the module structure under `src/modules/[module]/__tests__/`

## What to mock per layer

| Layer | Mock? | Rationale |
|---|---|---|
| `domain/*.entity.spec.ts` | **No** | Pure domain — test invariants (`create` validates, mutators update state, `delete` sets `deletedAt`, `pullEvents` empties the buffer). |
| `domain/validators/*.spec.ts` | **No** | `class-validator` over a POJO — deterministic. |
| `usecase/*/*.usecase.spec.ts` | **Yes** — mock the `Gateway` | Test orchestration (duplicate check, throws, calls to gateway). Never touch Prisma. |
| `facade/*.facade.spec.ts` | **Yes** — mock each UseCase | Test delegation + serialization (`findById → toJSON()`). |
| `repository/*.repository.spec.ts` | **Integration only** — do not place under `__tests__/` (unit). | Needs Prisma + a test DB. Put under `test/integration/`. |

## makeSut Pattern

```typescript
const makeSut = (response: any = null) => {
  const repository = {
    search: jest.fn().mockResolvedValue(response),
  };
  const useCase = new SearchUseCase(repository as any);
  return { useCase, repository };
};

describe('SearchUseCase', () => {
  it('should search', async () => {
    const { useCase, repository } = makeSut(mockResponse);
    const result = await useCase.execute(input);
    expect(repository.search).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual(expectedOutput);
  });
});
```

## Conventions

- One `describe` per class; nested `describe` per method when useful.
- Prefer `it.each` for table-driven cases (validations, normalizations).
- Use real entities in use case specs (don't mock `Workspace.create`) — they're pure and fast.
- Assertions on throws: `await expect(fn()).rejects.toBeInstanceOf(EntityValidationError)`.
- Never assert on `Date.now()` equality — use `expect.any(Date)` or freeze time with `jest.useFakeTimers()`.
