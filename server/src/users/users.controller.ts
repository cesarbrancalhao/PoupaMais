import { Controller, Get, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário atual' })
  @ApiResponse({ status: 200, description: 'Perfil recuperado com sucesso' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  // RN01 - Somente o usuário pode definir e alterar seus dados.
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(
      req.user.userId,
      updateProfileDto.nome,
      updateProfileDto.email,
    );
  }

  @Put('settings')
  @ApiOperation({ summary: 'Atualizar configurações do usuário' })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas com sucesso' })
  async updateSettings(@Request() req, @Body() updateSettingsDto: UpdateSettingsDto) {
    return this.usersService.updateSettings(
      req.user.userId,
      updateSettingsDto.idioma,
      updateSettingsDto.moeda,
    );
  }

  @Put('change-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Alterar senha do usuário' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta' })
  // RN01 - Somente o usuário pode definir e alterar seus dados.
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Delete('account')
  @ApiOperation({ summary: 'Excluir conta do usuário' })
  @ApiResponse({ status: 200, description: 'Conta excluída com sucesso' })
  async deleteAccount(@Request() req) {
    return this.usersService.deleteAccount(req.user.userId);
  }
}
