import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PasswordResetService {
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

  async requestPasswordReset(email: string): Promise<void> {
    const userResult = await this.databaseService.query(
      'SELECT id, nome FROM usuario WHERE email = $1',
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new BadRequestException('Email não encontrado');
    }

    const user = userResult.rows[0];

    const configResult = await this.databaseService.query(
      'SELECT idioma FROM config WHERE usuario_id = $1',
      [user.id],
    );

    const idioma = configResult.rows[0]?.idioma || 'portugues';

    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.databaseService.query(
      'DELETE FROM recuperacao_senha WHERE email = $1',
      [email],
    );

    await this.databaseService.query(
      'INSERT INTO recuperacao_senha (email, codigo, expira_em, usuario_id) VALUES ($1, $2, $3, $4)',
      [email, code, expiresAt, user.id],
    );

    await this.emailService.sendPasswordResetEmail(email, code, user.nome, idioma);
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const result = await this.databaseService.query(
      'SELECT * FROM recuperacao_senha WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Solicitação de recuperação não encontrada');
    }

    const recovery = result.rows[0];

    if (new Date() > new Date(recovery.expira_em)) {
      await this.databaseService.query('DELETE FROM recuperacao_senha WHERE id = $1', [recovery.id]);
      throw new BadRequestException('Código expirado');
    }

    if (recovery.tentativas >= 5) {
      await this.databaseService.query('DELETE FROM recuperacao_senha WHERE id = $1', [recovery.id]);
      throw new BadRequestException('Muitas tentativas inválidas');
    }

    if (recovery.codigo !== code.toUpperCase()) {
      await this.databaseService.query(
        'UPDATE recuperacao_senha SET tentativas = tentativas + 1 WHERE id = $1',
        [recovery.id],
      );
      throw new UnauthorizedException('Código inválido');
    }

    return true;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await this.verifyResetCode(email, code);

    const result = await this.databaseService.query(
      'SELECT usuario_id FROM recuperacao_senha WHERE email = $1 AND codigo = $2',
      [email, code.toUpperCase()],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Solicitação de recuperação não encontrada');
    }

    const recovery = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.databaseService.query(
      'UPDATE usuario SET senha = $1 WHERE id = $2',
      [hashedPassword, recovery.usuario_id],
    );

    await this.databaseService.query(
      'DELETE FROM recuperacao_senha WHERE id = $1',
      [recovery.id],
    );
  }
}
