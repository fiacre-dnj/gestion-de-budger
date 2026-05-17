import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Rapport mensuel détaillé' })
  @ApiQuery({ name: 'month', required: false, example: '4', description: 'Mois (1-12)' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @ApiOkResponse({ description: 'Rapport mensuel' })
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
  @ApiOperation({ summary: 'Rapport annuel détaillé' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @ApiOkResponse({ description: 'Rapport annuel' })
  async getAnnualReport(
    @Req() req: RequestWithUser,
    @Query('year') year: string,
  ) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.reportsService.getAnnualReport(req.user.userId, y);
  }
}
