import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('settings')
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() settings: { currency?: string },
  ) {
    return this.usersService.updateSettings(req.user.userId, settings);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() data: { name?: string; password?: string },
  ) {
    return this.usersService.updateProfile(req.user.userId, data);
  }

  @Post('verify-password')
  async verifyPassword(
    @Req() req: RequestWithUser,
    @Body() body: { password: string },
  ) {
    const isValid = await this.usersService.verifyPassword(req.user.userId, body.password);
    return { isValid };
  }
}
