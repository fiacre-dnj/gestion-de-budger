import { Injectable, Logger } from '@nestjs/common';
import { WalletsService } from '../../wallets/wallets.service';
import { CategoriesService } from '../../categories/categories.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { SavingsService } from '../../savings/savings.service';
import { AnalysisService } from '../../analysis/analysis.service';
import { CategoryType } from '../../categories/schemas/category.schema';

@Injectable()
export class AiToolsExecutor {
  private readonly logger = new Logger(AiToolsExecutor.name);

  constructor(
    private readonly walletsService: WalletsService,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly savingsService: SavingsService,
    private readonly analysisService: AnalysisService,
  ) {}

  async execute(userId: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    this.logger.debug(`Tool ${toolName}: ${JSON.stringify(args)}`);

    switch (toolName) {
      case 'list_wallets':
        return this.walletsService.findAll(userId);

      case 'list_categories': {
        const type = args.type as CategoryType | undefined;
        return this.categoriesService.findAll(userId, type);
      }

      case 'create_transaction':
        return this.createTransaction(userId, args);

      case 'get_transactions_summary': {
        const wallet = args.walletName
          ? await this.resolveWallet(userId, args.walletName as string)
          : null;
        return this.transactionsService.getSummary(userId, wallet?._id.toString());
      }

      case 'list_saving_goals':
        return this.savingsService.findAll(userId);

      case 'add_saving_contribution': {
        const goal = await this.resolveSavingGoal(userId, args.goalName as string);
        return this.savingsService.addContribution(
          goal._id.toString(),
          userId,
          args.amount as number,
        );
      }

      case 'get_monthly_analysis': {
        const now = new Date();
        const month = (args.month as number) || now.getMonth() + 1;
        const year = (args.year as number) || now.getFullYear();
        return this.analysisService.getMonthlyAnalysis(userId, month, year);
      }

      case 'get_financial_health':
        return this.analysisService.getFinancialHealth(userId);

      default:
        return { error: `Outil inconnu: ${toolName}` };
    }
  }

  private async createTransaction(userId: string, args: Record<string, unknown>) {
    const wallet = args.walletName
      ? await this.resolveWallet(userId, args.walletName as string)
      : null;

    let categoryId: string | undefined;
    if (args.categoryName) {
      const cat = await this.resolveCategory(userId, args.categoryName as string, args.type as string);
      categoryId = cat?._id.toString();
    }

    let toWalletId: string | undefined;
    if (args.toWalletName) {
      const toWallet = await this.resolveWallet(userId, args.toWalletName as string);
      toWalletId = toWallet._id.toString();
    }

    const date =
      (args.date as string) || new Date().toISOString().split('T')[0];

    return this.transactionsService.create(userId, {
      title: args.title as string,
      amount: args.amount as number,
      type: args.type as string,
      date,
      walletId: wallet?._id.toString(),
      category: categoryId,
      toWalletId,
      description: args.description as string | undefined,
    });
  }

  private async resolveWallet(userId: string, name: string) {
    const wallets = await this.walletsService.findAll(userId);
    const normalized = name.toLowerCase().trim();
    const match = wallets.find(
      (w) =>
        w.name.toLowerCase() === normalized ||
        w.name.toLowerCase().includes(normalized),
    );
    if (!match) {
      throw new Error(
        `Portefeuille "${name}" introuvable. Disponibles: ${wallets.map((w) => w.name).join(', ')}`,
      );
    }
    return match;
  }

  private async resolveCategory(userId: string, name: string, txType?: string) {
    const type =
      txType === 'income' ? CategoryType.INCOME : CategoryType.EXPENSE;
    const categories = await this.categoriesService.findAll(userId, type);
    const normalized = name.toLowerCase().trim();
    const match = categories.find(
      (c) =>
        c.name.toLowerCase() === normalized ||
        c.name.toLowerCase().includes(normalized),
    );
    if (!match) {
      throw new Error(
        `Catégorie "${name}" introuvable. Disponibles: ${categories.map((c) => c.name).join(', ')}`,
      );
    }
    return match;
  }

  private async resolveSavingGoal(userId: string, name: string) {
    const goals = await this.savingsService.findAll(userId);
    const normalized = name.toLowerCase().trim();
    const match = goals.find(
      (g: { title: string }) =>
        g.title.toLowerCase() === normalized ||
        g.title.toLowerCase().includes(normalized),
    );
    if (!match) {
      throw new Error(
        `Objectif "${name}" introuvable. Disponibles: ${goals.map((g: { title: string }) => g.title).join(', ')}`,
      );
    }
    return match;
  }
}
