import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private walletsService: WalletsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting migration check...');
    await this.migrateTransactionsToWallets();
    this.logger.log('Migration check completed.');
  }

  private async migrateTransactionsToWallets() {
    // Find all unique users with transactions missing a walletId
    const usersWithOrphanTransactions = await this.transactionModel.distinct('userId', {
      $or: [{ walletId: { $exists: false } }, { walletId: null }],
    });

    if (usersWithOrphanTransactions.length === 0) {
      this.logger.log('No transactions need migration.');
      return;
    }

    this.logger.log(`Found ${usersWithOrphanTransactions.length} users with orphan transactions.`);

    for (const userId of usersWithOrphanTransactions) {
      try {
        const wallet = await this.walletsService.ensureDefaultWallet(userId.toString());
        
        const result = await this.transactionModel.updateMany(
          {
            userId,
            $or: [{ walletId: { $exists: false } }, { walletId: null }],
          },
          { $set: { walletId: wallet._id } }
        );

        this.logger.log(`Migrated ${result.modifiedCount} transactions for user ${userId} to wallet ${wallet.name}`);
      } catch (error) {
        this.logger.error(`Failed to migrate transactions for user ${userId}: ${error.message}`);
      }
    }
  }
}
