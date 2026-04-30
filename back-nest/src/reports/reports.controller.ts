import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  async getMonthlyReport(
    @Req() req: RequestWithUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.reportsService.getMonthlyReport(req.user.userId, m, y);
  }

  @Get('annual')
  async getAnnualReport(
    @Req() req: RequestWithUser,
    @Query('year') year: string,
  ) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.reportsService.getAnnualReport(req.user.userId, y);
  }
}
