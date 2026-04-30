import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MigrationService } from './migration.service';
import { WalletsModule } from '../wallets/wallets.module';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    WalletsModule,
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
  ],
  providers: [MigrationService]
})
export class MigrationModule {}
