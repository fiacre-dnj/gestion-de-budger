import { Injectable } from '@nestjs/common';
import { WalletsService } from '../../wallets/wallets.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { SavingsService } from '../../savings/savings.service';
import { AnalysisService } from '../../analysis/analysis.service';

@Injectable()
export class ContextBuilderService {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
    private readonly savingsService: SavingsService,
    private readonly analysisService: AnalysisService,
  ) {}

  async build(userId: string): Promise<string> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [wallets, summary, goals, health] = await Promise.all([
      this.walletsService.findAll(userId),
      this.transactionsService.getSummary(userId),
      this.savingsService.findAll(userId),
      this.analysisService.getFinancialHealth(userId).catch(() => null),
    ]);

    const snapshot = {
      date: now.toISOString().split('T')[0],
      month,
      year,
      wallets: wallets.map((w) => ({
        name: w.name,
        type: w.type,
        balance: w.currentBalance ?? w.initialBalance,
      })),
      monthSummary: summary,
      savingGoals: goals.map((g: { title: string; currentAmount: number; targetAmount: number }) => ({
        title: g.title,
        progress: `${g.currentAmount}/${g.targetAmount}`,
        percent: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      })),
      financialHealth: health
        ? {
            score: (health as { score?: number }).score,
            status: (health as { status?: string }).status,
          }
        : null,
    };

    return JSON.stringify(snapshot, null, 2);
  }
}
