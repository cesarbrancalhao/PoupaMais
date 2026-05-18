import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';
import { User } from '../common/interfaces/user.interface';
import { EmailRateLimiterService } from '../common/rate-limit/email-rate-limiter.service';
import { AuditLogService } from '../common/audit/audit-log.service';

type Language = 'portuguese' | 'english' | 'spanish';

@Injectable()
export class VerificationService {
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

  async createVerification(
    name: string,
    email: string,
    password: string,
    language: Language,
  ): Promise<void> {
    this.emailRateLimiter.enforce('verification', email);

    const existingUser = await this.databaseService.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.databaseService.query('DELETE FROM verification WHERE email = $1', [email]);

    await this.databaseService.query(
      'INSERT INTO verification (name, email, password, language, code, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hashedPassword, language, code, expiresAt],
    );

    await this.emailService.sendVerificationEmail(email, code, name, language);

    this.auditLog.record({
      event: 'verification_code_sent',
      email,
      outcome: 'success',
    });
  }

  async verifyCode(email: string, code: string): Promise<Omit<User, 'password'>> {
    const result = await this.databaseService.query('SELECT * FROM verification WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      throw new BadRequestException('Verification not found');
    }

    const verification = result.rows[0];

    if (new Date() > new Date(verification.expires_at)) {
      await this.databaseService.query('DELETE FROM verification WHERE id = $1', [verification.id]);
      throw new BadRequestException('Code expired');
    }

    if (verification.attempts >= 5) {
      await this.databaseService.query('DELETE FROM verification WHERE id = $1', [verification.id]);
      throw new BadRequestException('Too many invalid attempts');
    }

    if (verification.code !== code.toUpperCase()) {
      await this.databaseService.query(
        'UPDATE verification SET attempts = attempts + 1 WHERE id = $1',
        [verification.id],
      );
      this.auditLog.record({
        event: 'verification_code_failed',
        email,
        outcome: 'failure',
        reason: 'invalid_code',
      });
      throw new UnauthorizedException('Invalid code');
    }

    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO users (name, email, password, language) VALUES ($1, $2, $3, $4) RETURNING id, name, email, language, currency, created_at',
        [verification.name, verification.email, verification.password, verification.language],
      );

      const newUser = userResult.rows[0];

      const defaultCategoriesByLanguage = {
        portuguese: [
          { name: 'Moradia', icon: 'Home' },
          { name: 'Eletrônicos', icon: 'Plug' },
          { name: 'Transporte', icon: 'Car' },
          { name: 'Alimentação', icon: 'Utensils' },
          { name: 'Saúde', icon: 'Heart' },
          { name: 'Lazer', icon: 'Gamepad-2' },
        ],
        english: [
          { name: 'Housing', icon: 'Home' },
          { name: 'Electronics', icon: 'Plug' },
          { name: 'Transportation', icon: 'Car' },
          { name: 'Food', icon: 'Utensils' },
          { name: 'Health', icon: 'Heart' },
          { name: 'Leisure', icon: 'Gamepad-2' },
        ],
        spanish: [
          { name: 'Vivienda', icon: 'Home' },
          { name: 'Electrónica', icon: 'Plug' },
          { name: 'Transporte', icon: 'Car' },
          { name: 'Alimentación', icon: 'Utensils' },
          { name: 'Salud', icon: 'Heart' },
          { name: 'Ocio', icon: 'Gamepad-2' },
        ],
      };

      const categories =
        defaultCategoriesByLanguage[verification.language] ||
        defaultCategoriesByLanguage.portuguese;
      for (const category of categories) {
        await client.query(
          'INSERT INTO expense_category (name, icon, user_id) VALUES ($1, $2, $3)',
          [category.name, category.icon, newUser.id],
        );
      }

      const defaultSourcesByLanguage = {
        portuguese: [
          { name: 'Salário', icon: 'Briefcase' },
          { name: 'Renda Fixa', icon: 'DollarSign' },
          { name: 'Renda Variável', icon: 'Apple' },
          { name: 'Extra', icon: 'Gift' },
        ],
        english: [
          { name: 'Salary', icon: 'Briefcase' },
          { name: 'Fixed Income', icon: 'DollarSign' },
          { name: 'Variable Income', icon: 'Apple' },
          { name: 'Extra Income', icon: 'Gift' },
        ],
        spanish: [
          { name: 'Salario', icon: 'Briefcase' },
          { name: 'Renta Fija', icon: 'DollarSign' },
          { name: 'Renta Variable', icon: 'Apple' },
          { name: 'Extra', icon: 'Gift' },
        ],
      };

      const sources =
        defaultSourcesByLanguage[verification.language] || defaultSourcesByLanguage.portuguese;
      for (const source of sources) {
        await client.query('INSERT INTO income_source (name, icon, user_id) VALUES ($1, $2, $3)', [
          source.name,
          source.icon,
          newUser.id,
        ]);
      }

      await client.query('DELETE FROM verification WHERE id = $1', [verification.id]);

      await client.query('COMMIT');

      this.auditLog.record({
        event: 'registration_completed',
        email: verification.email,
        userId: newUser.id,
        outcome: 'success',
      });

      return newUser as Omit<User, 'password'>;
    } catch {
      await client.query('ROLLBACK');
      throw new BadRequestException('Error creating user');
    } finally {
      await client.release();
    }
  }
}
