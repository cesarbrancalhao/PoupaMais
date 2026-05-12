import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { ResetPasswordDto } from '../src/auth/dto/reset-password.dto';
import { ChangePasswordDto } from '../src/users/dto/change-password.dto';
import { PASSWORD_COMPLEXITY_REGEX } from '../src/common/validators/password.validator';

describe('Password complexity regex', () => {
  it('rejects passwords missing uppercase', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('passw0rd!')).toBe(false);
  });
  it('rejects passwords missing lowercase', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('PASSW0RD!')).toBe(false);
  });
  it('rejects passwords missing digit', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password!')).toBe(false);
  });
  it('rejects passwords missing special char', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Passw0rds')).toBe(false);
  });
  it('accepts valid complex passwords', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Passw0rd!')).toBe(true);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Abcd1234#')).toBe(true);
  });
});

describe('DTO password validation', () => {
  it('RegisterDto rejects short password', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'X',
      email: 'a@b.com',
      password: 'Aa1!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('RegisterDto rejects long-but-simple password', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'X',
      email: 'a@b.com',
      password: 'alllowercase',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('RegisterDto accepts compliant password', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'X',
      email: 'a@b.com',
      password: 'Passw0rd!',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('ResetPasswordDto enforces complexity on newPassword', async () => {
    const dto = plainToInstance(ResetPasswordDto, {
      email: 'a@b.com',
      code: 'ABC123',
      newPassword: 'simplepass',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('ChangePasswordDto enforces complexity on newPassword', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: 'Whatever1!',
      newPassword: 'simplepass',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
