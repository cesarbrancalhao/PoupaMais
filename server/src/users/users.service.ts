import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditLogService } from '../common/audit/audit-log.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private databaseService: DatabaseService,
    private auditLog: AuditLogService,
  ) {}

  async findById(id: number) {
    const result = await this.databaseService.query(
      'SELECT id, name, email, language, currency, created_at FROM users WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result.rows[0];
  }

  async updateProfile(userId: number, name: string, email: string) {
    const existingMail = await this.databaseService.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId],
    );

    if (existingMail.rows.length > 0) {
      throw new UnauthorizedException('Email already exists');
    }

    const result = await this.databaseService.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, language, currency, created_at',
      [name, email, userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result.rows[0];
  }

  async updateSettings(userId: number, language: string, currency: string) {
    const result = await this.databaseService.query(
      'UPDATE users SET language = $1, currency = $2 WHERE id = $3 RETURNING id, name, email, language, currency, created_at',
      [language, currency, userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result.rows[0];
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const result = await this.databaseService.query('SELECT password FROM users WHERE id = $1', [
      userId,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      this.auditLog.record({
        event: 'password_changed',
        userId,
        outcome: 'failure',
        reason: 'invalid_current_password',
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.databaseService.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashedPassword,
      userId,
    ]);

    this.auditLog.record({
      event: 'password_changed',
      userId,
      outcome: 'success',
    });

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: number) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
      if (result.rowCount === 0) throw new NotFoundException('User not found');

      await client.query('COMMIT');

      this.auditLog.record({
        event: 'account_deleted',
        userId,
        outcome: 'success',
      });

      return { message: 'Account deleted successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
