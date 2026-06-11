import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportRowDto, ImportDto } from '../src/reports/dto/import.dto';
import { ExportQueryDto } from '../src/reports/dto/export-query.dto';

describe('ImportRowDto', () => {
  const FREE_TEXT_FIELDS = [
    'name',
    'icon',
    'category_name',
    'source_name',
    'description',
    'goal_name',
    'observation',
    'entity_name',
    'entity_type',
    'type_name',
    'saga_name',
  ];

  it('accepts a valid expense row', async () => {
    const dto = plainToInstance(ImportRowDto, {
      type: 'expense',
      name: 'Rent',
      value: 1200,
      recurring: true,
      date: '2025-01-05',
      category_name: 'Housing',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it.each(FREE_TEXT_FIELDS)('strips HTML from %s (stored XSS protection)', async (field) => {
    const dto = plainToInstance(ImportRowDto, {
      type: 'expense',
      [field]: '<script>alert(1)</script>Safe Value',
    });
    await validate(dto);
    expect((dto as unknown as Record<string, string>)[field]).toBe('Safe Value');
    expect((dto as unknown as Record<string, string>)[field]).not.toContain('<script>');
  });

  it.each(FREE_TEXT_FIELDS)('strips img/onerror payloads from %s', async (field) => {
    const dto = plainToInstance(ImportRowDto, {
      type: 'goal',
      [field]: '<img src=x onerror=alert(1)>Item',
    });
    await validate(dto);
    expect((dto as unknown as Record<string, string>)[field]).toBe('Item');
  });

  it.each([
    'expense_category',
    'income_source',
    'expense',
    'income',
    'goal',
    'goal_contribution',
    'expense_exclusion',
    'income_exclusion',
    'wishlist_type',
    'wishlist_saga',
    'wishlist',
  ])('accepts known record type %s', async (type) => {
    const dto = plainToInstance(ImportRowDto, { type });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects unknown record types', async () => {
    const dto = plainToInstance(ImportRowDto, { type: 'users' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts valid wishlist priorities', async () => {
    for (const priority of ['low', 'medium', 'high']) {
      const dto = plainToInstance(ImportRowDto, { type: 'wishlist', name: 'Item', priority });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('rejects priorities outside the wishlist enum', async () => {
    const dto = plainToInstance(ImportRowDto, {
      type: 'wishlist',
      name: 'Item',
      priority: 'urgent',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a valid quarter format', async () => {
    const dto = plainToInstance(ImportRowDto, { type: 'wishlist', name: 'Item', quarter: '25Q1' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects malformed quarter values', async () => {
    const dto = plainToInstance(ImportRowDto, {
      type: 'wishlist',
      name: 'Item',
      quarter: '<b>25Q9</b>',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates nested rows through ImportDto', async () => {
    const dto = plainToInstance(ImportDto, {
      rows: [{ type: 'not_a_type', name: '<script>x</script>' }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ExportQueryDto', () => {
  it('accepts a comma-separated list of integers for categories', async () => {
    const dto = plainToInstance(ExportQueryDto, { categories: '1,2,3' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a single integer for sources', async () => {
    const dto = plainToInstance(ExportQueryDto, { sources: '42' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects non-numeric categories values', async () => {
    const dto = plainToInstance(ExportQueryDto, { categories: '1,abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects sql-injection-like input in sources', async () => {
    const dto = plainToInstance(ExportQueryDto, { sources: "1' OR '1'='1" });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects trailing comma', async () => {
    const dto = plainToInstance(ExportQueryDto, { categories: '1,2,' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
