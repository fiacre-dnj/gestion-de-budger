import { Module, Global } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [CurrenciesService],
  controllers: [CurrenciesController],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
