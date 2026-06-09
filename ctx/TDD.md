# TDD Feature Implementation Prompt

This is a **mandatory workflow** for implementing any new feature, section, or bug fix in the PoupaMais project. Follow every phase in order. Do NOT skip phases. Do NOT write implementation before tests.

---

## Phase 0: Understand What Exists

Before writing anything, explore the codebase to understand the patterns:

1. **Database**: Read `server/data.sql` — this is the source of truth. All tables, columns, constraints, and indexes are defined here.
2. **Existing modules**: Pick the most similar existing module and study its structure:
   - Server: `server/src/<module>/` (dto/, service, controller, module)
   - Client: `client/src/services/<feature>.service.ts`, `client/src/types/<feature>.ts`
3. **Existing tests**: Read the reference tests listed below to understand the exact patterns you must follow:
   - Server service test: `server/tests/metas.service.spec.ts`
   - Server DTO test: `server/tests/api-compatibility-crud.spec.ts`
   - Client service test: `client/src/services/__tests__/wishlist.service.spec.ts`
   - Client component test: `client/src/components/__tests__/ProtectedRoute.spec.tsx`
   - E2E test: `client/e2e/smoke.spec.ts`

---

## Phase 1: Database Schema (if new tables/columns needed)

### 1.1 Write the migration FIRST

Add tables/columns to `server/data.sql`. Follow these rules:
- All tables get `user_id INT REFERENCES users(id) ON DELETE CASCADE`
- All tables get `created_at TIMESTAMP DEFAULT NOW()`
- Indexes on `user_id` and any foreign keys
- English column names ONLY (use `tx/naming-map.md` for reference)

### 1.2 Test the schema by reading it back

After writing the DDL, verify the table structure:
```bash
# Check the data.sql syntax and verify tables are defined correctly
# IMPORTANT: NEVER run db-purge or any data-destructive command automatically.
# The user must manually run make db-purge && make db if needed.
```

Then verify the schema references are correct:
```bash
docker exec poupa_mais_db psql -U postgres -d poupa_mais -c "\dt"
docker exec poupa_mais_db psql -U postgres -d poupa_mais -c "\d <new_table_name>"
```

---

## Phase 2: Server — DTOs and Validation Tests

### 2.1 Define DTOs FIRST

Create the DTO files using class-validator decorators:
- `server/src/<feature>/dto/create-<feature>.dto.ts`
- `server/src/<feature>/dto/update-<feature>.dto.ts` (extends PartialType of create)

Every DTO field must:
- Use English names (reject Portuguese: `nome`, `valor`, `data`, etc.)
- Use `@SanitizeText()` for all string fields
- Use `@IsNotEmpty()`, `@Min()`, `@IsIn()` etc. as appropriate
- Match the column names in `data.sql` exactly

### 2.2 Write DTO validation tests FIRST

File: `server/tests/<feature>.dto.spec.ts`

Pattern (copy from `server/tests/api-compatibility-crud.spec.ts`):
```typescript
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateXxxDto } from '../src/<feature>/dto/create-<feature>.dto';

describe('CreateXxxDto', () => {
  it('should accept English field names', async () => {
    const dto = plainToInstance(CreateXxxDto, {
      name: 'Valid Name',        // English fields ONLY
      value: 100.50,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject Portuguese field names', async () => {
    const dto = plainToInstance(CreateXxxDto, {
      nome: 'Nome',              // Portuguese = MUST BE REJECTED
      valor: 100.50,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

**Run and verify**: `cd server && npm test -- --testPathPattern="<feature>.dto"`

### 2.3 Implement DTOs to pass validation tests

Now implement the actual DTO classes. Run tests again — they must pass before moving on.

---

## Phase 3: Server — Service Tests (write tests, then implementation)

### 3.1 Write the service spec FIRST

File: `server/tests/<feature>.service.spec.ts`

Follow this exact pattern (from `server/tests/metas.service.spec.ts`):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { XxxService } from '../src/<feature>/<feature>.service';
import { DatabaseService } from '../src/database/database.service';

describe('XxxService', () => {
  let service: XxxService;
  let db: jest.Mocked<DatabaseService>;

  const mockItem = {
    id: 1,
    name: 'Test Item',
    created_at: new Date('2025-01-01'),
    user_id: 1,
  };

  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const mockDB = { query: jest.fn(), getClient: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [XxxService, { provide: DatabaseService, useValue: mockDB }],
    }).compile();

    service = module.get<XxxService>(XxxService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    db.getClient.mockResolvedValue(mockClient as any);
  });

  afterEach(() => { jest.clearAllMocks(); });

  describe('create', () => {
    it('should create an item successfully', async () => {
      // Setup: BEGIN -> check user -> INSERT -> SELECT -> COMMIT
      mockClient.query
        .mockResolvedValueOnce(undefined)              // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })  // check user exists
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })  // INSERT returning id
        .mockResolvedValueOnce({ rows: [mockItem] })    // SELECT the new row
        .mockResolvedValueOnce(undefined);               // COMMIT

      const result = await service.create(1, { name: 'Test Item' });
      expect(result).toEqual(mockItem);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not exist', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)   // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // user not found
      mockClient.query.mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(service.create(999, { name: 'Test' }))
        .rejects.toThrow(BadRequestException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockItem], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await service.findAll(1, 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should cap limit at 2000', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }], command: '', rowCount: 1, oid: 0, fields: [] });

      await service.findAll(1, 1, 5000);
      expect((db.query as jest.Mock).mock.calls[0][1][1]).toBe(2000);
    });
  });

  describe('findOne', () => {
    it('should return an item by id and userId', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockItem] });
      const result = await service.findOne(1, 1);
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item is not found', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updated = { ...mockItem, name: 'Updated' };
      mockClient.query
        .mockResolvedValueOnce(undefined)               // BEGIN
        .mockResolvedValueOnce({ rows: [updated] })      // UPDATE + RETURNING
        .mockResolvedValueOnce(undefined);                // COMMIT

      const result = await service.update(1, 1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException when item not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)   // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // not found
      mockClient.query.mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(service.update(999, 1, { name: 'Test' }))
        .rejects.toThrow(NotFoundException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('remove', () => {
    it('should delete an item', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 1 });
      const result = await service.remove(1, 1);
      expect(result.message).toBe('Xxx deleted successfully');
    });

    it('should throw NotFoundException when item not found', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('user scoping', () => {
    it('should not allow user A to access user B items', async () => {
      // findOne with user_id mismatch should throw NotFoundException
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      await expect(service.findOne(1, 2)).rejects.toThrow(NotFoundException);
    });
  });
});
```

**Key testing rules:**
- **Every mutating operation (create, update, delete) MUST use transactions** — mock `getClient()` returning `{ query, release }`, assert `BEGIN` and `COMMIT` are called, assert `ROLLBACK` on failure, assert `release()` is always called.
- **All queries must be user-scoped** — test that user A cannot see/modify/delete user B's data.
- **Foreign key cascades** — if your feature has FK relationships, test that deletion of a parent nullifies the child FK (not orphans).
- **Pagination** — `findAll` must be paginated, limit must be capped at 2000.

### 3.2 Implement the service and controller

Now implement the service to make the tests pass. Then create the controller with `@Controller('<feature>')` and `@UseGuards(JwtAuthGuard)`.

**CRITICAL: Controller route path**
```typescript
@Controller('wishlist-type')   // <-- This becomes /wishlist-type in the URL
export class WishlistTypeController { ... }
```
The client service will call this exact path. Document the route for the next phase.

### 3.3 Register the module

Add the module to `server/src/app.module.ts` imports list.

### 3.4 Run ALL server tests

```bash
cd server && npm test
```

**Every test must pass, including pre-existing ones.** If pre-existing tests break, fix your code — never skip or disable tests.

---

## Phase 4: Client — Types and Service Tests

### 4.1 Define types FIRST

File: `client/src/types/<feature>.ts`

Match the server DTOs and database columns exactly. Export all types. Add exports to `client/src/types/index.ts`.

### 4.2 Write the client service spec FIRST

File: `client/src/services/__tests__/<feature>.service.spec.ts`

```typescript
import { xxxService } from '../xxx.service';
import { apiService } from '../api';

jest.mock('../api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('XxxService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('getAll', () => {
    it('should fetch all items with pagination', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Test' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      (apiService.get as jest.Mock).mockResolvedValue(mockResult);

      const result = await xxxService.getAll(1, 20);
      expect(result).toEqual(mockResult);
      expect(apiService.get).toHaveBeenCalledWith('/xxx?page=1&limit=20');
    });
  });

  describe('getById', () => {
    it('should fetch a single item', async () => {
      const mockItem = { id: 1, name: 'Test' };
      (apiService.get as jest.Mock).mockResolvedValue(mockItem);

      const result = await xxxService.getById(1);
      expect(result).toEqual(mockItem);
      expect(apiService.get).toHaveBeenCalledWith('/xxx/1');
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const dto = { name: 'New Item', value: 100 };
      (apiService.post as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      const result = await xxxService.create(dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(apiService.post).toHaveBeenCalledWith('/xxx', dto);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const dto = { name: 'Updated' };
      const mockUpdated = { id: 1, name: 'Updated' };
      (apiService.put as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await xxxService.update(1, dto);
      expect(result).toEqual(mockUpdated);
      expect(apiService.put).toHaveBeenCalledWith('/xxx/1', dto);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      (apiService.delete as jest.Mock).mockResolvedValue(undefined);
      await xxxService.delete(1);
      expect(apiService.delete).toHaveBeenCalledWith('/xxx/1');
    });
  });
});
```

**CRITICAL — Verify endpoint paths match the server controller route:**
- Server `@Controller('wishlist-type')` → Client must call `/wishlist-type` (NOT `/wishlist/type`, NOT `/wishlist/type/`, NOT `/wishlisttypes`)
- This is the #1 cause of bugs. Triple-check this.

### 4.3 Implement the client service

Now implement the actual service file. Run tests — must pass.

### 4.4 Run ALL client tests

```bash
cd client && npm test
```

---

## Phase 5: Client — Component Tests

### 5.1 Write component tests FIRST

File: `client/src/components/__tests__/<Component>.spec.tsx`

Pattern for page/modals that use auth:

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import XxxPage from '@/app/xxx/page';
import { useAuth } from '@/contexts/AuthContext';
import { xxxService } from '@/services/xxx.service';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/xxx.service', () => ({
  xxxService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('XxxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, currency: 'EUR' },
    });
  });

  it('should show loading state', () => {
    (xxxService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<XxxPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show empty state when no items', async () => {
    (xxxService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    render(<XxxPage />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should show error state on fetch failure', async () => {
    (xxxService.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<XxxPage />);
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  it('should render items successfully', async () => {
    (xxxService.getAll as jest.Mock).mockResolvedValue({
      data: [{ id: 1, name: 'Test Item', value: 100 }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    render(<XxxPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  it('should create a new item via the add modal', async () => {
    (xxxService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    (xxxService.create as jest.Mock).mockResolvedValue({ id: 1, name: 'New Item' });

    render(<XxxPage />);

    // Open add modal
    await userEvent.click(screen.getByTestId('add-button'));
    // Fill form and submit
    await userEvent.type(screen.getByLabelText(/name/i), 'New Item');
    await userEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(xxxService.create).toHaveBeenCalled();
    });
  });
});
```

**Test at minimum these states for EVERY page/modal:**
1. Loading state (spinner shown)
2. Empty state (no data message)
3. Error state (error message displayed)
4. Success state (data rendered correctly)
5. User interaction (create/edit/delete calls appropriate service method)

### 5.2 Implement the component

Now build the component/page to make the tests pass. Run tests — must pass.

---

## Phase 6: E2E Smoke Tests

File: `client/e2e/<feature>.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('<Feature> Page', () => {
  test('page loads when authenticated', async ({ page }) => {
    // ... use storageState or login fixture to authenticate
    await page.goto('/xxx');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('can navigate to the page from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/xxx"]');
    await expect(page).toHaveURL(/\/xxx/);
  });
});
```

Run: `cd client && npm run test:smoke` (or `npm run test:e2e`)

---

## Phase 7: Final Verification (MANDATORY)

Before considering the task done, run ALL of these:

```bash
# Server tests
cd server && npm test
# Expected: ALL tests pass. Zero failures.

# Client tests
cd client && npm test
# Expected: ALL tests pass. Zero failures.

# Lint (if configured)
cd client && npm run lint
# Expected: Clean. Fix any issues.
```

### Manual smoke test (if DB schema was changed)

**IMPORTANT: NEVER run `make db-purge` or any data-destructive command automatically.** If the DB schema was changed, instruct the user to manually run `make db-purge && make db && make dev`, then:
- Create an item
- Edit an item
- Delete an item
- Verify no other user's data is visible

---

## Common Pitfalls — Test for These Explicitly

| Pitfall | How to prevent |
|---|---|
| Frontend calls `/wishlist-type` but server route is `wishlist-type` | Client service test MUST assert the exact URL string passed to `apiService.get/post/put/delete` |
| Added a DB column but forgot to update INSERT/SELECT queries | Service test must include the new column in mock data and assert it's returned |
| Portuguese field names (`nome`, `valor`) accepted by DTO | DTO validation test must reject Portuguese fields |
| Transaction not used for mutations | Service test must assert `BEGIN`/`COMMIT`/`ROLLBACK`/`release` |
| User can see other users' data | Service test must assert `user_id` in WHERE clause |
| Deleting a referenced type orphans items | Service test must assert FK is set to NULL, not items deleted |
| Modal/page doesn't handle loading/error/empty states | Component test must cover all three states |
| New module not registered in app.module.ts | After implementation, `cd server && npm test` will catch import errors |

---

## Summary Checklist

- [ ] `server/data.sql` updated with new tables/columns (if needed)
- [ ] DTOs defined with class-validator decorators, English field names
- [ ] DTO validation tests pass (English accepted, Portuguese rejected)
- [ ] Server service spec written and passing (create, findAll, findOne, update, remove)
- [ ] Server service spec tests transactions (BEGIN/COMMIT/ROLLBACK)
- [ ] Server service spec tests user scoping
- [ ] Server service spec tests pagination and limit cap
- [ ] Server service tested for FK cascade on parent deletion
- [ ] Server controller created with correct `@Controller()` route
- [ ] Module registered in `app.module.ts`
- [ ] Client types defined in `client/src/types/`
- [ ] Client service spec written and passing (getAll, getById, create, update, delete)
- [ ] Client service spec asserts EXACT endpoint path (matches server controller)
- [ ] Client service implemented
- [ ] Component tests written covering loading, empty, error, success states
- [ ] Component tests covering create/edit/delete interactions
- [ ] Component implemented with `'use client'` directive
- [ ] Sidebar updated if new page added
- [ ] i18n keys added for all three languages (pt, en, es)
- [ ] `cd server && npm test` — all green
- [ ] `cd client && npm test` — all green
- [ ] Manual smoke test passes