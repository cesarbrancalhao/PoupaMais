import { HttpException } from '@nestjs/common';
import { EmailRateLimiterService } from '../src/common/rate-limit/email-rate-limiter.service';

describe('EmailRateLimiterService', () => {
  let service: EmailRateLimiterService;

  beforeEach(() => {
    service = new EmailRateLimiterService();
  });

  it('allows up to 3 sends per email within the window', () => {
    expect(() => service.enforce('verification', 'a@b.com')).not.toThrow();
    expect(() => service.enforce('verification', 'a@b.com')).not.toThrow();
    expect(() => service.enforce('verification', 'a@b.com')).not.toThrow();
  });

  it('blocks the 4th send to the same email within the window', () => {
    service.enforce('verification', 'a@b.com');
    service.enforce('verification', 'a@b.com');
    service.enforce('verification', 'a@b.com');
    expect(() => service.enforce('verification', 'a@b.com')).toThrow(HttpException);
  });

  it('normalizes email casing and whitespace', () => {
    service.enforce('verification', 'A@B.com');
    service.enforce('verification', '  a@b.COM ');
    service.enforce('verification', 'a@b.com');
    expect(() => service.enforce('verification', 'a@b.com')).toThrow(HttpException);
  });

  it('tracks scopes independently', () => {
    service.enforce('verification', 'a@b.com');
    service.enforce('verification', 'a@b.com');
    service.enforce('verification', 'a@b.com');
    expect(() => service.enforce('password-reset', 'a@b.com')).not.toThrow();
  });

  it('separates recipients within a scope', () => {
    service.enforce('verification', 'a@b.com');
    service.enforce('verification', 'a@b.com');
    service.enforce('verification', 'a@b.com');
    expect(() => service.enforce('verification', 'c@d.com')).not.toThrow();
  });

  it('resets the bucket after the window elapses', () => {
    const now = Date.now();
    const realNow = Date.now;
    try {
      Date.now = jest.fn(() => now);
      service.enforce('verification', 'a@b.com');
      service.enforce('verification', 'a@b.com');
      service.enforce('verification', 'a@b.com');

      Date.now = jest.fn(() => now + 60 * 60 * 1000 + 1);
      expect(() => service.enforce('verification', 'a@b.com')).not.toThrow();
    } finally {
      Date.now = realNow;
    }
  });
});
