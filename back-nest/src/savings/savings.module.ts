import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
import { AuthModule } from '../auth/auth.module';
import { SavingGoal, SavingGoalSchema } from './schemas/saving-goal.schema';

import { TransactionsModule } from '../transactions/transactions.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SavingGoal.name, schema: SavingGoalSchema }]),
    AuthModule,
    TransactionsModule,
    CategoriesModule,
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
