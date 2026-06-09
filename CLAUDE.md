# PoupaMais — Agent Instructions

## CRITICAL: TDD Mandate

**You MUST follow Test-Driven Development for every feature, bug fix, and change you make. This is non-negotiable.**

If you touch any of the following, you MUST write or update tests for it before considering the task done:

1. **Server: Services, Controllers, DTOs** — Jest unit tests
2. **Client: API service functions** — Jest unit tests (mock `apiService`)
3. **Client: Components** — Jest component tests (mock auth/contexts)
4. **Client: Pure utility functions** — Jest unit tests
5. **End-to-end flows** — Playwright E2E tests (if the feature has a UI page)

The goal is that `npm test` in both `server/` and `client/` passes with no failures, and every new piece of behavior is covered, validating edge cases and security concerns.

## Project Structure

```
client/     — Next.js 15 App Router (React 19, Tailwind 4)
server/     — NestJS 10 (PostgreSQL, raw SQL via DatabaseService)
ctx/        — Feature specs & planning documents
```

## Testing Infrastructure

### Server tests (`server/`)
- Framework: Jest (config: `server/jest.config.js`)
- Run: `npm test` (inside `server/`)
- Location: `server/tests/*.spec.ts`
- Pattern: Use `Test.createTestingModule` from `@nestjs/testing`, mock `DatabaseService` (mock `getClient()` returning `{ query, release }`). Test BEGIN/COMMIT/ROLLBACK transaction flows.
- Reference: `server/tests/metas.service.spec.ts`, `server/tests/wishlist.service.spec.ts`

### Client service tests (`client/`)
- Framework: Jest + jsdom (config: `client/jest.config.js`)
- Run: `npm test` (inside `client/`)
- Location: `client/src/services/__tests__/*.spec.ts`
- Pattern: Mock `@/services/api` (`apiService.get`, `.post`, `.put`, `.delete`), test each method calls the correct endpoint and returns data.
- Reference: `client/src/services/__tests__/wishlist.service.spec.ts`

### Client component tests (`client/`)
- Framework: Jest + `@testing-library/react`
- Location: `client/src/components/__tests__/*.spec.tsx`
- Pattern: Mock `@/contexts/AuthContext`, `next/navigation`, render with `@testing-library/react`.
- Reference: `client/src/components/__tests__/ProtectedRoute.spec.tsx`

### DTO validation tests (`server/`)
- Location: `server/tests/` (e.g., `api-compatibility-crud.spec.ts`)
- Pattern: Use `plainToInstance` + `validate` from `class-validator` to test field validation.

### E2E tests (`client/`)
- Framework: Playwright (config: `client/playwright.config.ts`)
- Run: `npm run test:e2e` (inside `client/`)
- Location: `client/e2e/*.spec.ts`
- Reference: `client/e2e/smoke.spec.ts`

## Testing Workflow (Mandatory)

For EVERY feature implementation, follow this order:

### Phase 1: Define the contract
- Write DTOs and types FIRST
- Write DTO validation tests (`server/tests/`) verifying English fields are accepted

### Phase 2: Server tests (write tests, then implementation)
1. Write the service spec (`server/tests/<feature>.service.spec.ts`) with mocked DB
2. Implement the service and controller to make tests pass
3. Write DTO validation tests if applicable
4. Run `npm test` in `server/` — ALL tests must pass

### Phase 3: Client service tests (write tests, then implementation)
1. Write the service spec (`client/src/services/__tests__/<feature>.service.spec.ts`) with mocked `apiService`
2. Implement the service to make tests pass
3. Verify endpoints match the server's actual routes
4. Run `npm test` in `client/` — ALL tests must pass

### Phase 4: Client components (write tests, then implementation)
1. If building a new page/modal/component, write component tests
2. Mock auth context, navigation, services as needed
3. Test loading, error, empty, and success states
4. Implement the component to make tests pass

### Phase 5: E2E smoke (optional but recommended for pages)
1. Write a Playwright spec testing the page loads and basic interaction works
2. Run `npm run test:smoke` or `npm run test:e2e` in `client/`

### Phase 6: Final verification
- `cd server && npm test` — all green
- `cd client && npm test` — all green
- `cd client && npm run lint` — clean (if `npm run lint` is available)
- If DB schema was changed, instruct the user to manually run `make dump [useremail] && make db-purge && make run` or approve manual database ALTER/CREATE commands before testing. NEVER run db-purge or any data-destructive command automatically.

## Common Pitfalls to Test For

These are real bugs that have happened in this project. Test for them explicitly:

1. **Frontend endpoint mismatch** — The client service calls `/wishlist-type` but the server controller is `@Controller('wishlist-type')`. Always verify the actual route path matches.
2. **Database schema not updated** — If you add a column to a table, verify the INSERT and SELECT queries include it. Test that the service can create with the new field.
3. **DTO field name language mismatch** — This project uses English field names. Portuguese fields (e.g., `nome`, `valor`) must be REJECTED by DTO validation. See `server/tests/api-compatibility-crud.spec.ts`.
4. **Transaction safety** — All mutating operations (create, update, delete) MUST use transactions (BEGIN/COMMIT/ROLLBACK). Test that ROLLBACK fires on failure.
5. **User scoping** — All queries must filter by `user_id`. Test that User A cannot access/update/delete User B's data.
6. **Foreign key constraints** — On deletion of referenced entities (types, categories), test that related items have their FK set to NULL (not orphaned).

## Before Considering a Task Done

- [ ] New server tests exist and pass (`cd server && npm test`)
- [ ] New client tests exist and pass (`cd client && npm test`)
- [ ] All pre-existing tests still pass (no regressions)
- [ ] Test files are placed in the correct directories (see above)
- [ ] New tests follow the pattern of existing tests in that directory
