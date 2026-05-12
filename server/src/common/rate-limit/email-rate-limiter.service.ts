import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface RateBucket {
  count: number;
  windowStart: number;
}

@Injectable()
export class EmailRateLimiterService {
  private readonly windowMs = 60 * 60 * 1000;
  private readonly maxPerWindow = 3;
  private readonly buckets = new Map<string, Map<string, RateBucket>>();

  enforce(scope: string, recipient: string): void {
    const normalized = recipient.trim().toLowerCase();
    const now = Date.now();

    let scopeBuckets = this.buckets.get(scope);
    if (!scopeBuckets) {
      scopeBuckets = new Map();
      this.buckets.set(scope, scopeBuckets);
    }

    const bucket = scopeBuckets.get(normalized);
    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      scopeBuckets.set(normalized, { count: 1, windowStart: now });
      return;
    }

    if (bucket.count >= this.maxPerWindow) {
      const retryAfterMs = this.windowMs - (now - bucket.windowStart);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many emails sent to this address. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).`,
          retryAfterMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
  }
}
