import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from './auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscrire un nouvel utilisateur' })
  @ApiCreatedResponse({ description: 'Compte créé, tokens JWT retournés' })
  @ApiConflictResponse({ description: 'Email déjà utilisé' })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  @ApiOkResponse({ description: 'Tokens JWT retournés' })
  @ApiUnauthorizedResponse({ description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens JWT' })
  @ApiOkResponse({ description: 'Nouveaux tokens JWT' })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalide ou expiré' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter (révoquer un refresh token)' })
  @ApiOkResponse({ description: 'Déconnexion réussie' })
  @ApiUnauthorizedResponse({ description: 'Non authentifié' })
  async logout(
    @Req() req: RequestWithUser,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.logout(req.user.userId, refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter de tous les appareils' })
  @ApiOkResponse({ description: 'Tous les refresh tokens révoqués' })
  @ApiUnauthorizedResponse({ description: 'Non authentifié' })
  async logoutAll(@Req() req: RequestWithUser) {
    return this.authService.logoutAll(req.user.userId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtenir les informations de l\'utilisateur connecté' })
  @ApiOkResponse({ description: 'Profil JWT (userId, email)' })
  @ApiUnauthorizedResponse({ description: 'Non authentifié' })
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }
}
