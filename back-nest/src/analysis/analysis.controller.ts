import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Analysis')
@ApiBearerAuth('access-token')
@Controller('analysis')
@UseGuards(AuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Analyse mensuelle des dépenses et revenus' })
  @ApiQuery({ name: 'month', required: false, example: '4', description: 'Mois (1-12)' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @ApiQuery({ name: 'walletId', required: false, description: 'Filtrer par portefeuille' })
  @ApiOkResponse({ description: 'Analyse mensuelle par catégorie' })
  async getMonthly(
    @Req() req: RequestWithUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('walletId') walletId?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();
    return this.analysisService.getMonthlyAnalysis(req.user.userId, m, y, walletId);
  }

  @Get('annual')
  @ApiOperation({ summary: 'Analyse annuelle des dépenses et revenus' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @ApiQuery({ name: 'walletId', required: false, description: 'Filtrer par portefeuille' })
  @ApiOkResponse({ description: 'Analyse annuelle par mois' })
  async getAnnual(
    @Req() req: RequestWithUser,
    @Query('year') year?: string,
    @Query('walletId') walletId?: string,
  ) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.analysisService.getAnnualAnalysis(req.user.userId, y, walletId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Score de santé financière' })
  @ApiOkResponse({ description: 'Indicateurs et score de santé financière' })
  async getHealth(@Req() req: RequestWithUser) {
    return this.analysisService.getFinancialHealth(req.user.userId);
  }
}
