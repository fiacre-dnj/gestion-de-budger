import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('currencies')
@UseGuards(AuthGuard)
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get('rates')
  getRates() {
    return this.currenciesService.getRates();
  }
}
