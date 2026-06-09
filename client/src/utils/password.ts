export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{}\[\]|;:'",.<>/?`~]).+$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character';

export function isPasswordStrong(password: string): boolean {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_COMPLEXITY_REGEX.test(password)
  );
}
