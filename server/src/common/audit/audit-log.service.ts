import { Injectable, Logger } from '@nestjs/common';

export type AuditEvent =
  | 'registration_started'
  | 'registration_completed'
  | 'verification_code_sent'
  | 'verification_code_verified'
  | 'verification_code_failed'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset_code_sent'
  | 'password_reset_code_verified'
  | 'password_reset_code_failed'
  | 'password_reset_completed'
  | 'password_changed'
  | 'profile_updated'
  | 'account_deleted';

export interface AuditEntry {
  event: AuditEvent;
  email?: string;
  userId?: number;
  outcome: 'success' | 'failure';
  reason?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('AUDIT');

  record(entry: AuditEntry): void {
    const payload = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    if (entry.outcome === 'failure') {
      this.logger.warn(JSON.stringify(payload));
    } else {
      this.logger.log(JSON.stringify(payload));
    }
  }
}
