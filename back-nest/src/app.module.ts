import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { AnalysisModule } from './analysis/analysis.module';
import { SavingsModule } from './savings/savings.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ImportModule } from './import/import.module';
import { ReportsModule } from './reports/reports.module';
import { WalletsModule } from './wallets/wallets.module';
import { MigrationModule } from './migration/migration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-app'),
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    CurrenciesModule,
    AnalysisModule,
    SavingsModule,
    SubscriptionsModule,
    ImportModule,
    ReportsModule,
    WalletsModule,
    MigrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
