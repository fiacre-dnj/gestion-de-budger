import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AuthModule } from '../auth/auth.module';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Subscription, SubscriptionSchema } from '../subscriptions/schemas/subscription.schema';
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    AuthModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
