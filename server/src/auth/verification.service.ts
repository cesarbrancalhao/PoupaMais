import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';
import { User } from '../common/interfaces/user.interface';

type Language = 'portugues' | 'ingles' | 'espanhol';

@Injectable()
export class VerificationService {
  constructor(
    private databaseService: DatabaseService,
    private emailService: EmailService,
  ) {}

  private generateOTP(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createVerification(name: string, email: string, password: string, language: Language): Promise<void> {
    const existingUser = await this.databaseService.query(
      'SELECT id FROM usuario WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.databaseService.query(
      'DELETE FROM verificacao WHERE email = $1',
      [email],
    );

    await this.databaseService.query(
      'INSERT INTO verificacao (nome, email, senha, idioma, codigo, expira_em) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hashedPassword, language, code, expiresAt],
    );

    await this.emailService.sendVerificationEmail(email, code, name, language);
  }

  async verifyCode(email: string, code: string): Promise<Omit<User, 'senha'>> {
    const result = await this.databaseService.query(
      'SELECT * FROM verificacao WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Verification not found');
    }

    const verification = result.rows[0];

    if (new Date() > new Date(verification.expira_em)) {
      await this.databaseService.query('DELETE FROM verificacao WHERE id = $1', [verification.id]);
      throw new BadRequestException('Code expired');
    }

    if (verification.tentativas >= 5) {
      await this.databaseService.query('DELETE FROM verificacao WHERE id = $1', [verification.id]);
      throw new BadRequestException('Too many invalid attempts');
    }

    if (verification.codigo !== code.toUpperCase()) {
      await this.databaseService.query(
        'UPDATE verificacao SET tentativas = tentativas + 1 WHERE id = $1',
        [verification.id],
      );
      throw new UnauthorizedException('Invalid code');
    }

    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO usuario (nome, email, senha, idioma) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, idioma, moeda, created_at',
        [verification.nome, verification.email, verification.senha, verification.idioma],
      );

      const newUser = userResult.rows[0];

      const defaultCategoriesByLanguage = {
        portugues: [
          { nome: 'Moradia', icone: 'Home' },
          { nome: 'Eletrônicos', icone: 'Plug' },
          { nome: 'Transporte', icone: 'Car' },
          { nome: 'Alimentação', icone: 'Utensils' },
          { nome: 'Saúde', icone: 'Heart' },
          { nome: 'Lazer', icone: 'Gamepad-2' },
        ],
        ingles: [
          { nome: 'Housing', icone: 'Home' },
          { nome: 'Electronics', icone: 'Plug' },
          { nome: 'Transportation', icone: 'Car' },
          { nome: 'Food', icone: 'Utensils' },
          { nome: 'Health', icone: 'Heart' },
          { nome: 'Leisure', icone: 'Gamepad-2' },
        ],
        espanhol: [
          { nome: 'Vivienda', icone: 'Home' },
          { nome: 'Electrónica', icone: 'Plug' },
          { nome: 'Transporte', icone: 'Car' },
          { nome: 'Alimentación', icone: 'Utensils' },
          { nome: 'Salud', icone: 'Heart' },
          { nome: 'Ocio', icone: 'Gamepad-2' },
        ],
      };

      const categories = defaultCategoriesByLanguage[verification.idioma] || defaultCategoriesByLanguage.portugues;
      for (const category of categories) {
        await client.query(
          'INSERT INTO categoria_despesa (nome, icone, usuario_id) VALUES ($1, $2, $3)',
          [category.nome, category.icone, newUser.id],
        );
      }

      const defaultSourcesByLanguage = {
        portugues: [
          { nome: 'Salário', icone: 'Briefcase' },
          { nome: 'Renda Fixa', icone: 'DollarSign' },
          { nome: 'Renda Variável', icone: 'Apple' },
          { nome: 'Extra', icone: 'Gift' },
        ],
        ingles: [
          { nome: 'Salary', icone: 'Briefcase' },
          { nome: 'Fixed Income', icone: 'DollarSign' },
          { nome: 'Variable Income', icone: 'Apple' },
          { nome: 'Extra Income', icone: 'Gift' },
        ],
        espanhol: [
          { nome: 'Salario', icone: 'Briefcase' },
          { nome: 'Renta Fija', icone: 'DollarSign' },
          { nome: 'Renta Variable', icone: 'Apple' },
          { nome: 'Extra', icone: 'Gift' },
        ],
      };

      const sources = defaultSourcesByLanguage[verification.idioma] || defaultSourcesByLanguage.portugues;
      for (const source of sources) {
        await client.query(
          'INSERT INTO fonte_receita (nome, icone, usuario_id) VALUES ($1, $2, $3)',
          [source.nome, source.icone, newUser.id],
        );
      }

      await client.query('DELETE FROM verificacao WHERE id = $1', [verification.id]);

      await client.query('COMMIT');

      return newUser as Omit<User, 'senha'>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new BadRequestException('Error creating user');
    } finally {
      await client.release();
    }
  }
}
