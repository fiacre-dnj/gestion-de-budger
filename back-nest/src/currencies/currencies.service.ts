import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrenciesService {
  // Base is MGA
  private readonly rates = {
    MGA: 1,
    EUR: 1 / 5000, // 1 MGA = 1/5000 EUR
    USD: 1 / 4600, // 1 MGA = 1/4600 USD
  };

  getRates() {
    return this.rates;
  }

  convertFromMGA(amount: number, targetCurrency: string): number {
    const rate = this.rates[targetCurrency] || 1;
    return amount * rate;
  }

  convertToMGA(amount: number, sourceCurrency: string): number {
    const rate = this.rates[sourceCurrency] || 1;
    return amount / rate;
  }
}
