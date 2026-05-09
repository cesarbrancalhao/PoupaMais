import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { VerificationService } from '../src/auth/verification.service';
import { PasswordResetService } from '../src/auth/password-reset.service';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { LoginDto } from '../src/auth/dto/login.dto';
import { VerifyCodeDto } from '../src/auth/dto/verify-code.dto';
import { RequestPasswordResetDto } from '../src/auth/dto/request-password-reset.dto';
import { VerifyPasswordResetDto } from '../src/auth/dto/verify-password-reset.dto';
import { ResetPasswordDto } from '../src/auth/dto/reset-password.dto';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { UpdateProfileDto } from '../src/users/dto/update-profile.dto';
import { UpdateSettingsDto } from '../src/users/dto/update-settings.dto';
import { ChangePasswordDto } from '../src/users/dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../src/database/database.service';
import { EmailService } from '../src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('Client-Server API Field Name Compatibility', () => {
  describe('RegisterDto', () => {
    it('should accept English field names (name, email, password, language)', async () => {
      const dto = plainToInstance(RegisterDto, {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'password123',
        language: 'english',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept portuguese as default language', async () => {
      const dto = plainToInstance(RegisterDto, {
        name: 'John',
        email: 'user@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field nome', async () => {
      const dto = plainToInstance(RegisterDto, {
        nome: 'Joao',
        email: 'user@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('LoginDto', () => {
    it('should accept English field names (email, password)', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('VerifyCodeDto', () => {
    it('should accept English field names (email, code)', async () => {
      const dto = plainToInstance(VerifyCodeDto, {
        email: 'user@example.com',
        code: 'ABC123',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field codigo', async () => {
      const dto = plainToInstance(VerifyCodeDto, {
        email: 'user@example.com',
        codigo: 'ABC123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RequestPasswordResetDto', () => {
    it('should accept English field names (email)', async () => {
      const dto = plainToInstance(RequestPasswordResetDto, {
        email: 'user@example.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('VerifyPasswordResetDto', () => {
    it('should accept English field names (email, code)', async () => {
      const dto = plainToInstance(VerifyPasswordResetDto, {
        email: 'user@example.com',
        code: 'ABC123',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ResetPasswordDto', () => {
    it('should accept English field names (email, code, newPassword)', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        email: 'user@example.com',
        code: 'ABC123',
        newPassword: 'newpassword123',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should require newPassword to be at least 8 characters', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        email: 'user@example.com',
        code: 'ABC123',
        newPassword: 'short',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });
  });

  describe('UpdateProfileDto', () => {
    it('should accept English field names (name, email)', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        name: 'John Doe',
        email: 'user@example.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field nome', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        nome: 'Joao',
        email: 'user@example.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('UpdateSettingsDto', () => {
    it('should accept English field names (language, currency)', async () => {
      const dto = plainToInstance(UpdateSettingsDto, {
        language: 'english',
        currency: 'dollar',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field idioma', async () => {
      const dto = plainToInstance(UpdateSettingsDto, {
        idioma: 'portugues',
        moeda: 'real',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });

    it('should reject old Portuguese enum values', async () => {
      const dto = plainToInstance(UpdateSettingsDto, {
        language: 'portugues',
        currency: 'dolar',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('ChangePasswordDto', () => {
    it('should accept English field names (currentPassword, newPassword)', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: '12345678',
        newPassword: '87654321',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
