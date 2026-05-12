import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';
import { EmailRateLimiterService } from '../common/rate-limit/email-rate-limiter.service';
import { AuditLogService } from '../common/audit/audit-log.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private databaseService: DatabaseService,
    private emailService: EmailService,
    private emailRateLimiter: EmailRateLimiterService,
    private auditLog: AuditLogService,
  ) {}

  private generateOTP(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(randomInt(0, chars.length));
    }
    return code;
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.emailRateLimiter.enforce('password-reset', email);

    const userResult = await this.databaseService.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new BadRequestException('Email not found');
    }

    const user = userResult.rows[0];

    const configResult = await this.databaseService.query(
      'SELECT language FROM config WHERE user_id = $1',
      [user.id],
    );

    const language = configResult.rows[0]?.language || 'portuguese';

    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.databaseService.query(
      'DELETE FROM password_reset WHERE email = $1',
      [email],
    );

    await this.databaseService.query(
      'INSERT INTO password_reset (email, code, expires_at, user_id) VALUES ($1, $2, $3, $4)',
      [email, code, expiresAt, user.id],
    );

    await this.emailService.sendPasswordResetEmail(email, code, user.name, language);

    this.auditLog.record({
      event: 'password_reset_code_sent',
      email,
      userId: user.id,
      outcome: 'success',
    });
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const result = await this.databaseService.query(
      'SELECT * FROM password_reset WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Password reset request not found');
    }

    const recovery = result.rows[0];

    if (new Date() > new Date(recovery.expires_at)) {
      await this.databaseService.query('DELETE FROM password_reset WHERE id = $1', [recovery.id]);
      throw new BadRequestException('Code expired');
    }

    if (recovery.attempts >= 5) {
      await this.databaseService.query('DELETE FROM password_reset WHERE id = $1', [recovery.id]);
      throw new BadRequestException('Too many invalid attempts');
    }

    if (recovery.code !== code.toUpperCase()) {
      await this.databaseService.query(
        'UPDATE password_reset SET attempts = attempts + 1 WHERE id = $1',
        [recovery.id],
      );
      this.auditLog.record({
        event: 'password_reset_code_failed',
        email,
        outcome: 'failure',
        reason: 'invalid_code',
      });
      throw new UnauthorizedException('Invalid code');
    }

    return true;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await this.verifyResetCode(email, code);

    const result = await this.databaseService.query(
      'SELECT user_id FROM password_reset WHERE email = $1 AND code = $2',
      [email, code.toUpperCase()],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Password reset request not found');
    }

    const recovery = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.databaseService.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, recovery.user_id],
    );

    await this.databaseService.query(
      'DELETE FROM password_reset WHERE id = $1',
      [recovery.id],
    );

    this.auditLog.record({
      event: 'password_reset_completed',
      email,
      userId: recovery.user_id,
      outcome: 'success',
    });
  }
}
