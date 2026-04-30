import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    AuthModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
