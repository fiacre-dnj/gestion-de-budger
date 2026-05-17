import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@Controller('subscriptions')
@UseGuards(AuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un abonnement' })
  @ApiCreatedResponse({ description: 'Abonnement créé' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les abonnements' })
  @ApiOkResponse({ description: 'Liste des abonnements' })
  async findAll(@Req() req: RequestWithUser) {
    return this.subscriptionsService.findAll(req.user.userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Résumé des coûts d\'abonnements' })
  @ApiOkResponse({ description: 'Totaux mensuels et annuels' })
  async getSummary(@Req() req: RequestWithUser) {
    return this.subscriptionsService.getSummary(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un abonnement par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de l\'abonnement' })
  @ApiOkResponse({ description: 'Détail de l\'abonnement' })
  @ApiNotFoundResponse({ description: 'Abonnement introuvable' })
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.subscriptionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un abonnement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de l\'abonnement' })
  @ApiOkResponse({ description: 'Abonnement mis à jour' })
  @ApiNotFoundResponse({ description: 'Abonnement introuvable' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un abonnement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de l\'abonnement' })
  @ApiOkResponse({ description: 'Abonnement supprimé' })
  @ApiNotFoundResponse({ description: 'Abonnement introuvable' })
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.subscriptionsService.remove(req.user.userId, id);
    return { message: 'Abonnement supprimé avec succès' };
  }
}
