import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AnalysisModule,
    SubscriptionsModule,
    CategoriesModule,
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
