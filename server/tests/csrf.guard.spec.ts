import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from '../src/auth/guards/csrf.guard';

function mockContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    guard = new CsrfGuard(reflector);
  });

  it('allows GET requests without CSRF', () => {
    const ctx = mockContext({ method: 'GET', cookies: { token: 't' }, headers: {} });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows HEAD and OPTIONS', () => {
    for (const method of ['HEAD', 'OPTIONS']) {
      const ctx = mockContext({ method, cookies: { token: 't' }, headers: {} });
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('allows state-changing requests when there is no auth token cookie', () => {
    const ctx = mockContext({ method: 'POST', cookies: {}, headers: {} });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects state-changing authenticated requests without a CSRF header', () => {
    const ctx = mockContext({
      method: 'POST',
      cookies: { token: 't', csrf_token: 'abc' },
      headers: {},
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects requests when header and cookie do not match', () => {
    const ctx = mockContext({
      method: 'POST',
      cookies: { token: 't', csrf_token: 'abc' },
      headers: { 'x-csrf-token': 'wrong' },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('accepts requests when header matches cookie', () => {
    const ctx = mockContext({
      method: 'POST',
      cookies: { token: 't', csrf_token: 'abc' },
      headers: { 'x-csrf-token': 'abc' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('respects @SkipCsrf metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = mockContext({
      method: 'POST',
      cookies: { token: 't', csrf_token: 'abc' },
      headers: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
