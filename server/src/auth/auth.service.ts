import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { User } from '../common/interfaces/user.interface';
import { AuditLogService } from '../common/audit/audit-log.service';

type Language = 'portuguese' | 'english' | 'spanish';

const defaultCategoriesByLanguage: Record<Language, { name: string; icon: string }[]> = {
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

const defaultSourcesByLanguage: Record<Language, { name: string; icon: string }[]> = {
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

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
  ) {}

  async getUserById(userId: number) {
    const result = await this.databaseService.query(
      'SELECT id, name, email, language, currency, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }
    return result.rows[0];
  }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const result = await this.databaseService.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      this.auditLog.record({
        event: 'login_failure',
        email,
        outcome: 'failure',
        reason: 'user_not_found',
      });
      return null;
    }

    const user = result.rows[0] as User;
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.auditLog.record({
        event: 'login_failure',
        email,
        userId: user.id,
        outcome: 'failure',
        reason: 'invalid_password',
      });
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    this.auditLog.record({
      event: 'login_success',
      email: user.email,
      userId: user.id,
      outcome: 'success',
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        currency: user.currency,
      },
    };
  }

  async register(name: string, email: string, password: string, language: Language = 'portuguese') {
    const existingUser = await this.databaseService.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO users (name, email, password, language) VALUES ($1, $2, $3, $4) RETURNING id, name, email, language, currency, created_at',
        [name, email, hashedPassword, language],
      );

      const newUser = result.rows[0];

      const categories =
        defaultCategoriesByLanguage[language] || defaultCategoriesByLanguage.portuguese;
      for (const category of categories) {
        await client.query(
          'INSERT INTO expense_category (name, icon, user_id) VALUES ($1, $2, $3)',
          [category.name, category.icon, newUser.id],
        );
      }

      const sources = defaultSourcesByLanguage[language] || defaultSourcesByLanguage.portuguese;
      for (const source of sources) {
        await client.query('INSERT INTO income_source (name, icon, user_id) VALUES ($1, $2, $3)', [
          source.name,
          source.icon,
          newUser.id,
        ]);
      }

      await client.query('COMMIT');

      return this.login(newUser);
    } catch {
      await client.query('ROLLBACK');
      throw new UnauthorizedException('There was an error registering the user');
    } finally {
      await client.release();
    }
  }
}
