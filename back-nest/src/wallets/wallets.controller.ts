import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(req.user.userId, createWalletDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.walletsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.walletsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletsService.update(id, req.user.userId, updateWalletDto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.walletsService.remove(id, req.user.userId);
  }
}
