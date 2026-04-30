import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TransactionsModule, CategoriesModule, AuthModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
