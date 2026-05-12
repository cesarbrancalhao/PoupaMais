import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const rejectUnauthorized =
      this.configService.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized,
      },
    });
  }

  async sendVerificationEmail(email: string, code: string, name: string, language: 'portuguese' | 'english' | 'spanish'): Promise<void> {
    const translations = {
      portuguese: {
        subject: 'Código de Verificação - PoupaMais',
        greeting: 'Olá',
        message: 'Seu código de verificação é:',
        expires: 'Este código expira em 15 minutos.',
        ignore: 'Se você não solicitou este código, ignore este email.',
        thanks: 'Obrigado por usar PoupaMais!',
      },
      english: {
        subject: 'Verification Code - PoupaMais',
        greeting: 'Hello',
        message: 'Your verification code is:',
        expires: 'This code expires in 15 minutes.',
        ignore: 'If you did not request this code, please ignore this email.',
        thanks: 'Thank you for using PoupaMais!',
      },
      spanish: {
        subject: 'Código de Verificación - PoupaMais',
        greeting: 'Hola',
        message: 'Su código de verificación es:',
        expires: 'Este código expira en 15 minutos.',
        ignore: 'Si no solicitó este código, ignore este correo electrónico.',
        thanks: '¡Gracias por usar PoupaMais!',
      },
    };

    const t = translations[language] || translations.portuguese;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM'),
      to: email,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .code-box { background-color: #f4f4f4; border: 2px dashed #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #4F46E5;">PoupaMais</h1>
            </div>
            <p>${t.greeting} <strong>${name}</strong>,</p>
            <p>${t.message}</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p><small>${t.expires}</small></p>
            <p><small>${t.ignore}</small></p>
            <div class="footer">
              <p>${t.thanks}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, code: string, name: string, language: 'portuguese' | 'english' | 'spanish'): Promise<void> {
    const translations = {
      portuguese: {
        subject: 'Recuperação de Senha - PoupaMais',
        greeting: 'Olá',
        message: 'Você solicitou a recuperação de senha. Use o código abaixo para redefinir sua senha:',
        expires: 'Este código expira em 15 minutos.',
        ignore: 'Se você não solicitou a recuperação de senha, ignore este email e sua senha permanecerá inalterada.',
        thanks: 'Obrigado por usar PoupaMais!',
        security: 'Por segurança, nunca compartilhe este código com ninguém.',
      },
      english: {
        subject: 'Password Recovery - PoupaMais',
        greeting: 'Hello',
        message: 'You requested a password recovery. Use the code below to reset your password:',
        expires: 'This code expires in 15 minutes.',
        ignore: 'If you did not request a password recovery, please ignore this email and your password will remain unchanged.',
        thanks: 'Thank you for using PoupaMais!',
        security: 'For security, never share this code with anyone.',
      },
      spanish: {
        subject: 'Recuperación de Contraseña - PoupaMais',
        greeting: 'Hola',
        message: 'Solicitó la recuperación de contraseña. Use el código a continuación para restablecer su contraseña:',
        expires: 'Este código expira en 15 minutos.',
        ignore: 'Si no solicitó la recuperación de contraseña, ignore este correo electrónico y su contraseña permanecerá sin cambios.',
        thanks: '¡Gracias por usar PoupaMais!',
        security: 'Por seguridad, nunca comparta este código con nadie.',
      },
    };

    const t = translations[language] || translations.portuguese;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM'),
      to: email,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .code-box { background-color: #f4f4f4; border: 2px dashed #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #4F46E5;">PoupaMais</h1>
            </div>
            <p>${t.greeting} <strong>${name}</strong>,</p>
            <p>${t.message}</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p><small>${t.expires}</small></p>
            <div class="warning">
              <p style="margin: 0;"><strong>${t.security}</strong></p>
            </div>
            <p><small>${t.ignore}</small></p>
            <div class="footer">
              <p>${t.thanks}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
