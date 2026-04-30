import { Injectable } from '@nestjs/common';
import { AnalysisService } from '../analysis/analysis.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ReportsService {
  constructor(
    private analysisService: AnalysisService,
    private subscriptionsService: SubscriptionsService,
    private categoriesService: CategoriesService,
  ) {}

  async getMonthlyReport(userId: string, month: number, year: number) {
    const [analysis, health, subscriptions, categories] = await Promise.all([
      this.analysisService.getMonthlyAnalysis(userId, month, year),
      this.analysisService.getFinancialHealth(userId),
      this.subscriptionsService.findAll(userId),
      this.categoriesService.findAll(userId),
    ]);

    // Separate income and expense categories
    const incomeCategories = analysis.categoryBreakdown.filter((c: any) => c.type === 'income');
    const expenseCategories = analysis.categoryBreakdown.filter((c: any) => c.type === 'expense');

    // Calculate subscription totals
    const activeSubs = subscriptions.filter(s => s.isActive);
    const totalSubscriptions = activeSubs.reduce((sum, s) => sum + s.amount, 0);

    // Consolidate data for a formal report
    return {
      period: { month, year },
      reportType: 'monthly',
      summary: {
        totalIncome: analysis.totals.income,
        totalExpenses: analysis.totals.expenses,
        netBalance: analysis.totals.balance,
        predictedEndOfMonth: analysis.prediction.endOfMonthBalance,
      },
      healthScore: health.rule503020,
      remainingToLive: health.remainingToLive,
      incomeCategories,
      expenseCategories,
      walletBreakdown: analysis.walletBreakdown,
      topCategories: analysis.categoryBreakdown.slice(0, 5),
      budgetAlerts: analysis.categoryBreakdown
        .filter(c => c.monthlyBudget && c.amount > c.monthlyBudget)
        .map(c => ({
          name: c.name,
          spent: c.amount,
          budget: c.monthlyBudget,
          over: c.amount - (c.monthlyBudget || 0),
        })),
      subscriptions: {
        active: activeSubs,
        total: totalSubscriptions,
        count: activeSubs.length,
      },
      comparison: analysis.comparison,
      tips: health.tips,
      generatedAt: new Date(),
    };
  }

  async getAnnualReport(userId: string, year: number) {
    const [monthlyTrend, health, subscriptions] = await Promise.all([
      this.analysisService.getAnnualAnalysis(userId, year),
      this.analysisService.getFinancialHealth(userId),
      this.subscriptionsService.findAll(userId),
    ]);

    // Compute annual totals from the monthly trend
    let totalIncome = 0;
    let totalExpenses = 0;
    let bestMonth = { month: 0, balance: -Infinity };
    let worstMonth = { month: 0, balance: Infinity };
    const activeMonths: number[] = [];

    monthlyTrend.forEach((m: any) => {
      totalIncome += m.income;
      totalExpenses += m.expenses;
      const balance = m.income - m.expenses;
      if (m.income > 0 || m.expenses > 0) {
        activeMonths.push(m.month);
        if (balance > bestMonth.balance) bestMonth = { month: m.month, balance };
        if (balance < worstMonth.balance) worstMonth = { month: m.month, balance };
      }
    });

    const monthCount = activeMonths.length || 1;
    const avgMonthlyIncome = totalIncome / monthCount;
    const avgMonthlyExpenses = totalExpenses / monthCount;

    // Get category breakdown for the whole year by aggregating each active month
    const categoryMap = new Map<string, { name: string; type: string; amount: number }>();

    // Fetch category breakdown for each active month
    for (const month of activeMonths) {
      try {
        const analysis = await this.analysisService.getMonthlyAnalysis(userId, month, year);
        analysis.categoryBreakdown.forEach((c: any) => {
          const key = c.name + '|' + c.type;
          if (categoryMap.has(key)) {
            categoryMap.get(key)!.amount += c.amount;
          } else {
            categoryMap.set(key, { name: c.name, type: c.type, amount: c.amount });
          }
        });
      } catch {
        // Skip months with errors
      }
    }

    const allCategories = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
    const incomeCategories = allCategories.filter(c => c.type === 'income');
    const expenseCategories = allCategories.filter(c => c.type === 'expense');

    // Subscriptions
    const activeSubs = subscriptions.filter(s => s.isActive);
    const monthlySubTotal = activeSubs.reduce((sum, s) => sum + s.amount, 0);
    const annualSubTotal = monthlySubTotal * 12;

    // Format month names
    const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

    const formattedTrend = monthlyTrend.map((m: any) => ({
      ...m,
      monthName: monthNames[m.month - 1],
      balance: m.income - m.expenses,
    }));

    return {
      period: { year },
      reportType: 'annual',
      summary: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        avgMonthlyIncome: parseFloat(avgMonthlyIncome.toFixed(2)),
        avgMonthlyExpenses: parseFloat(avgMonthlyExpenses.toFixed(2)),
        avgMonthlyBalance: parseFloat((avgMonthlyIncome - avgMonthlyExpenses).toFixed(2)),
      },
      bestMonth: bestMonth.month > 0 ? { monthName: monthNames[bestMonth.month - 1], balance: bestMonth.balance } : null,
      worstMonth: worstMonth.month > 0 ? { monthName: monthNames[worstMonth.month - 1], balance: worstMonth.balance } : null,
      monthlyTrend: formattedTrend,
      walletBreakdown: await this.analysisService.getWalletSpread(userId, new Date(year, 11, 31, 23, 59, 59)),
      activeMonthsCount: monthCount,
      incomeCategories,
      expenseCategories,
      budgetAlerts: [], // Not applicable for annual currently
      healthScore: health.rule503020,
      subscriptions: {
        active: activeSubs,
        monthlyTotal: monthlySubTotal,
        annualTotal: annualSubTotal,
        count: activeSubs.length,
      },
      tips: health.tips,
      generatedAt: new Date(),
    };
  }
}
