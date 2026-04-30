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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('subscriptions')
@UseGuards(AuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(req.user.userId, createDto);
  }

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    return this.subscriptionsService.findAll(req.user.userId);
  }

  @Get('summary')
  async getSummary(@Req() req: RequestWithUser) {
    return this.subscriptionsService.getSummary(req.user.userId);
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.subscriptionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.subscriptionsService.remove(req.user.userId, id);
    return { message: 'Abonnement supprimé avec succès' };
  }
}
