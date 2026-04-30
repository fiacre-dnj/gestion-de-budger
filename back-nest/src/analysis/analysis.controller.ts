import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('analysis')
@UseGuards(AuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('monthly')
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
  async getAnnual(
    @Req() req: RequestWithUser,
    @Query('year') year?: string,
    @Query('walletId') walletId?: string,
  ) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.analysisService.getAnnualAnalysis(req.user.userId, y, walletId);
  }

  @Get('health')
  async getHealth(@Req() req: RequestWithUser) {
    return this.analysisService.getFinancialHealth(req.user.userId);
  }
}
