import { plainToInstance } from 'class-transformer';
import { sanitizeText } from '../src/common/sanitization/sanitize';
import { CreateGoalDto } from '../src/goals/dto/create-goal.dto';
import { CreateExpenseDto } from '../src/expenses/dto/create-expense.dto';
import { RegisterDto } from '../src/auth/dto/register.dto';

describe('sanitizeText', () => {
  it('strips html tags', () => {
    expect(sanitizeText('<script>alert(1)</script>hi')).toBe('hi');
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('preserves plain text and trims', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('returns non-string values unchanged', () => {
    expect(sanitizeText(42 as unknown as string)).toBe(42);
    expect(sanitizeText(undefined)).toBeUndefined();
    expect(sanitizeText(null)).toBeNull();
  });
});

describe('SanitizeText transformer on DTOs', () => {
  it('strips html from goal name and description', () => {
    const dto = plainToInstance(CreateGoalDto, {
      name: '<b>Trip</b>',
      description: '<script>bad</script>Plan',
      value: 100,
    });
    expect(dto.name).toBe('Trip');
    expect(dto.description).toBe('Plan');
  });

  it('strips html from expense name', () => {
    const dto = plainToInstance(CreateExpenseDto, {
      name: '<img src=x>Market',
      value: 5,
      recurring: false,
      date: '2025-01-01',
    });
    expect(dto.name).toBe('Market');
  });

  it('strips html from registration name', () => {
    const dto = plainToInstance(RegisterDto, {
      name: '<script>x</script>John',
      email: 'a@b.com',
      password: 'Passw0rd!',
    });
    expect(dto.name).toBe('John');
  });
});
