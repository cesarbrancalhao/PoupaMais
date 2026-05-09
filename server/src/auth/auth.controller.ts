import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { VerificationService } from './verification.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private verificationService: VerificationService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Start registration - sends verification code by email' })
  @ApiResponse({ status: 201, description: 'Verification code sent' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async register(@Body() registerDto: RegisterDto) {
    await this.verificationService.createVerification(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.language,
    );
    return { message: 'Verification code sent to email' };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify')
  @ApiOperation({ summary: 'Verify code and complete registration' })
  @ApiResponse({ status: 200, description: 'User verified and registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    const user = await this.verificationService.verifyCode(
      verifyCodeDto.email,
      verifyCodeDto.code,
    );
    return this.authService.login(user);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request password reset - sends code by email' })
  @ApiResponse({ status: 201, description: 'Recovery code sent' })
  @ApiResponse({ status: 400, description: 'Email not found' })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    await this.passwordResetService.requestPasswordReset(requestPasswordResetDto.email);
    return { message: 'Recovery code sent to email' };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-reset-code')
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Code is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyResetCode(@Body() verifyPasswordResetDto: VerifyPasswordResetDto) {
    await this.passwordResetService.verifyResetCode(
      verifyPasswordResetDto.email,
      verifyPasswordResetDto.code,
    );
    return { message: 'Code is valid' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with verification code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }
}
