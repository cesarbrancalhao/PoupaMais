import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';
import { Usuario } from '../common/interfaces/user.interface';

@Injectable()
export class VerificationService {
  constructor(
    private databaseService: DatabaseService,
    private emailService: EmailService,
  ) {}

  // RN25 - O código de verificação deve ser gerado aleatoriamente e ser um código alfanumérico de 6 dígitos com números e letras maiúsculas.
  private generateOTP(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createVerification(nome: string, email: string, password: string, idioma: 'portugues' | 'ingles' | 'espanhol'): Promise<void> {
    // RN02 - O cadastro do usuário deve ser confirmado por um código enviado para o email inserido.
    const existingUser = await this.databaseService.query(
      'SELECT id FROM usuario WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new BadRequestException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = this.generateOTP();
    // RN03 - O código de confirmação expira em 15 minutos; caso não seja utilizado, o usuário deve solicitar um novo código.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.databaseService.query(
      'DELETE FROM verificacao WHERE email = $1',
      [email],
    );

    await this.databaseService.query(
      'INSERT INTO verificacao (nome, email, senha, idioma, codigo, expira_em) VALUES ($1, $2, $3, $4, $5, $6)',
      [nome, email, hashedPassword, idioma, code, expiresAt],
    );

    await this.emailService.sendVerificationEmail(email, code, nome, idioma);
  }

  async verifyCode(email: string, code: string): Promise<Omit<Usuario, 'senha'>> {
    const result = await this.databaseService.query(
      'SELECT * FROM verificacao WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Verificação não encontrada');
    }

    const verification = result.rows[0];

    // RN21 - A validação de tempo de expiração do código de validação será feita pelo backend, utilizando o horário de criação salvo no banco de dados.
    if (new Date() > new Date(verification.expira_em)) {
      await this.databaseService.query('DELETE FROM verificacao WHERE id = $1', [verification.id]);
      throw new BadRequestException('Código expirado');
    }

    // RN05 - O sistema dará 5 tentativas para a confirmação do código. Após isso será necessário solicitar um novo código.
    if (verification.tentativas >= 5) {
      await this.databaseService.query('DELETE FROM verificacao WHERE id = $1', [verification.id]);
      throw new BadRequestException('Muitas tentativas inválidas');
    }

    if (verification.codigo !== code.toUpperCase()) {
      await this.databaseService.query(
        'UPDATE verificacao SET tentativas = tentativas + 1 WHERE id = $1',
        [verification.id],
      );
      throw new UnauthorizedException('Código inválido');
    }

    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO usuario (nome, email, senha, idioma) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, idioma, moeda, created_at',
        [verification.nome, verification.email, verification.senha, verification.idioma],
      );

      const newUser = userResult.rows[0];

      // RN07 - No momento do cadastro do usuário, o sistema deverá cadastrar as seguintes categorias de despesas: Moradia, Eletrônicos, Transporte, Alimentação, Saúde, Lazer.
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

      const categorias = defaultCategoriesByLanguage[verification.idioma] || defaultCategoriesByLanguage.portugues;
      for (const categoria of categorias) {
        await client.query(
          'INSERT INTO categoria_despesa (nome, icone, usuario_id) VALUES ($1, $2, $3)',
          [categoria.nome, categoria.icone, newUser.id],
        );
      }

      // RN08 - No momento do cadastro do usuário, o sistema deverá cadastrar as seguintes fontes de receitas: Salário, Renda Fixa, Renda Variável, Extra.
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

      const fontes = defaultSourcesByLanguage[verification.idioma] || defaultSourcesByLanguage.portugues;
      for (const fonte of fontes) {
        await client.query(
          'INSERT INTO fonte_receita (nome, icone, usuario_id) VALUES ($1, $2, $3)',
          [fonte.nome, fonte.icone, newUser.id],
        );
      }

      await client.query('DELETE FROM verificacao WHERE id = $1', [verification.id]);

      await client.query('COMMIT');

      return newUser as Omit<Usuario, 'senha'>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new BadRequestException('Erro ao criar usuário');
    } finally {
      await client.release();
    }
  }
}
