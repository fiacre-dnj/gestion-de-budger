import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obtenir le profil utilisateur complet' })
  @ApiOkResponse({ description: 'Profil utilisateur' })
  @ApiUnauthorizedResponse({ description: 'Non authentifié' })
  async getProfile(@Req() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Mettre à jour les paramètres (devise, etc.)' })
  @ApiOkResponse({ description: 'Paramètres mis à jour' })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() settings: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(req.user.userId, settings);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Mettre à jour le profil (nom, mot de passe)' })
  @ApiOkResponse({ description: 'Profil mis à jour' })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() data: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, data);
  }

  @Post('verify-password')
  @ApiOperation({ summary: 'Vérifier le mot de passe actuel' })
  @ApiOkResponse({ description: '{ isValid: boolean }' })
  async verifyPassword(
    @Req() req: RequestWithUser,
    @Body() body: VerifyPasswordDto,
  ) {
    const isValid = await this.usersService.verifyPassword(req.user.userId, body.password);
    return { isValid };
  }
}
