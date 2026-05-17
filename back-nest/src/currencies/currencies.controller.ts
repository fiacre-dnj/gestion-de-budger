import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Currencies')
@ApiBearerAuth('access-token')
@Controller('currencies')
@UseGuards(AuthGuard)
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Obtenir les taux de change' })
  @ApiOkResponse({ description: 'Taux de change par devise' })
  getRates() {
    return this.currenciesService.getRates();
  }
}
