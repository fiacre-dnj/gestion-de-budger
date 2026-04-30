import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SavingsService } from './savings.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { SavingGoal } from './schemas/saving-goal.schema';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('savings')
@UseGuards(AuthGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get('goals')
  findAll(@Req() req: RequestWithUser) {
    return this.savingsService.findAll(req.user.userId);
  }

  @Post('goals')
  create(@Req() req: RequestWithUser, @Body() data: Partial<SavingGoal>) {
    return this.savingsService.create(req.user.userId, data);
  }

  @Patch('goals/:id')
  update(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() data: Partial<SavingGoal>,
  ) {
    return this.savingsService.update(id, req.user.userId, data);
  }

  @Delete('goals/:id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.savingsService.remove(id, req.user.userId);
  }

  @Post('goals/:id/contribute')
  addContribution(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body('amount') amount: number,
  ) {
    return this.savingsService.addContribution(id, req.user.userId, amount);
  }
}
