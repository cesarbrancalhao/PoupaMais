import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { User } from '../common/interfaces/user.interface';

type Language = 'portugues' | 'ingles' | 'espanhol';

const defaultCategoriesByLanguage: Record<Language, { nome: string; icone: string }[]> = {
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

const defaultSourcesByLanguage: Record<Language, { nome: string; icone: string }[]> = {
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

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'senha'> | null> {
    const result = await this.databaseService.query(
      'SELECT * FROM usuario WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0] as User;
    const isPasswordValid = await bcrypt.compare(password, user.senha);

    if (!isPasswordValid) {
      return null;
    }

    const { senha, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: Omit<User, 'senha'>) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        idioma: user.idioma,
        moeda: user.moeda,
      },
    };
  }

  async register(name: string, email: string, password: string, language: Language = 'portugues') {
    const existingUser = await this.databaseService.query(
      'SELECT id FROM usuario WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO usuario (nome, email, senha, idioma) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, idioma, moeda, created_at',
        [name, email, hashedPassword, language],
      );

      const newUser = result.rows[0];

      const categories = defaultCategoriesByLanguage[language] || defaultCategoriesByLanguage.portugues;
      for (const category of categories) {
        await client.query(
          'INSERT INTO categoria_despesa (nome, icone, usuario_id) VALUES ($1, $2, $3)',
          [category.nome, category.icone, newUser.id],
        );
      }

      const sources = defaultSourcesByLanguage[language] || defaultSourcesByLanguage.portugues;
      for (const source of sources) {
        await client.query(
          'INSERT INTO fonte_receita (nome, icone, usuario_id) VALUES ($1, $2, $3)',
          [source.nome, source.icone, newUser.id],
        );
      }

      await client.query('COMMIT');

      return this.login(newUser);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new UnauthorizedException('There was an error registering the user');
    }
    finally {
      await client.release();
    }
  }
}
