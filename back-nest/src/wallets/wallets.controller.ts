import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Wallets')
@ApiBearerAuth('access-token')
@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un portefeuille' })
  @ApiCreatedResponse({ description: 'Portefeuille créé' })
  create(@Req() req: RequestWithUser, @Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(req.user.userId, createWalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les portefeuilles avec solde actuel' })
  @ApiOkResponse({ description: 'Liste des portefeuilles' })
  findAll(@Req() req: RequestWithUser) {
    return this.walletsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un portefeuille par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du portefeuille' })
  @ApiOkResponse({ description: 'Détail du portefeuille' })
  @ApiNotFoundResponse({ description: 'Portefeuille introuvable' })
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.walletsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un portefeuille' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du portefeuille' })
  @ApiOkResponse({ description: 'Portefeuille mis à jour' })
  @ApiNotFoundResponse({ description: 'Portefeuille introuvable' })
  update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletsService.update(id, req.user.userId, updateWalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un portefeuille' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du portefeuille' })
  @ApiOkResponse({ description: 'Portefeuille supprimé' })
  @ApiNotFoundResponse({ description: 'Portefeuille introuvable' })
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.walletsService.remove(id, req.user.userId);
  }
}
