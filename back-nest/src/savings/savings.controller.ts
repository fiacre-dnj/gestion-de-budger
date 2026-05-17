import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SavingsService } from './savings.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';
import { ContributeDto } from './dto/contribute.dto';
import { SavingGoal } from './schemas/saving-goal.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Savings')
@ApiBearerAuth('access-token')
@Controller('savings')
@UseGuards(AuthGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get('goals')
  @ApiOperation({ summary: 'Lister les objectifs d\'épargne' })
  @ApiOkResponse({ description: 'Liste des objectifs' })
  findAll(@Req() req: RequestWithUser) {
    return this.savingsService.findAll(req.user.userId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Créer un objectif d\'épargne' })
  @ApiCreatedResponse({ description: 'Objectif créé' })
  create(@Req() req: RequestWithUser, @Body() data: CreateSavingGoalDto) {
    return this.savingsService.create(req.user.userId, data as unknown as Partial<SavingGoal>);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Modifier un objectif d\'épargne' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de l\'objectif' })
  @ApiOkResponse({ description: 'Objectif mis à jour' })
  @ApiNotFoundResponse({ description: 'Objectif introuvable' })
  update(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() data: UpdateSavingGoalDto,
  ) {
    return this.savingsService.update(id, req.user.userId, data as unknown as Partial<SavingGoal>);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Supprimer un objectif d\'épargne' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de l\'objectif' })
  @ApiOkResponse({ description: 'Objectif supprimé' })
  @ApiNotFoundResponse({ description: 'Objectif introuvable' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.savingsService.remove(id, req.user.userId);
  }

  @Post('goals/:id/contribute')
  @ApiOperation({ summary: 'Ajouter une contribution à un objectif' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de l\'objectif' })
  @ApiOkResponse({ description: 'Contribution enregistrée' })
  @ApiNotFoundResponse({ description: 'Objectif introuvable' })
  addContribution(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() body: ContributeDto,
  ) {
    return this.savingsService.addContribution(id, req.user.userId, body.amount);
  }
}
