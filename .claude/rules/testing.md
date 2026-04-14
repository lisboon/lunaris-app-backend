---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
---

# Tests — Rules

- **Framework**: Jest + SWC
- **Pattern**: `makeSut()` factory for setup
- **Mocks**: `jest.fn()` in the repositories
- **No I/O**: unit tests never access the database or HTTP

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
