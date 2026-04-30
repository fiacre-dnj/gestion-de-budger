import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Subscription, SubscriptionDocument } from '../subscriptions/schemas/subscription.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async getMonthlyAnalysis(userId: string, month: number, year: number, walletId?: string) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const match: any = { 
      userId: new Types.ObjectId(userId),
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };

    if (walletId) {
      match.walletId = new Types.ObjectId(walletId);
    }

    // 1. Global Totals
    let income = 0;
    let expenses = 0;

    if (!walletId) {
      const totals = await this.transactionModel.aggregate([
        { $match: { ...match, type: { $in: ['income', 'expense'] } } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);
      income = totals.find((t) => t._id === 'income')?.total || 0;
      expenses = totals.find((t) => t._id === 'expense')?.total || 0;
    } else {
      const walletIdObj = new Types.ObjectId(walletId);
      const result = await this.transactionModel.aggregate([
        {
          $match: {
            userId: match.userId,
            date: match.date,
            $or: [{ walletId: walletIdObj }, { toWalletId: walletIdObj }],
          },
        },
        {
          $project: {
            amount: 1,
            isOutflow: {
              $or: [
                { $eq: ['$type', 'expense'] },
                { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$walletId', walletIdObj] }] },
              ],
            },
            isInflow: {
              $or: [
                { $eq: ['$type', 'income'] },
                { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$toWalletId', walletIdObj] }] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
            totalOutflow: { $sum: { $cond: ['$isOutflow', '$amount', 0] } },
          },
        },
      ]);
      income = result[0]?.totalInflow || 0;
      expenses = result[0]?.totalOutflow || 0;
    }

    // 2. Breakdown by Category
    const categoryMatch = !walletId 
      ? { ...match, type: { $in: ['income', 'expense'] } }
      : { 
          userId: match.userId, 
          date: match.date, 
          $or: [{ walletId: new Types.ObjectId(walletId) }, { toWalletId: new Types.ObjectId(walletId) }] 
        };

    const categoryBreakdown = await this.transactionModel.aggregate([
      { $match: categoryMatch },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          // For transfers, we might want to label them if they don't have a category,
          // but usually transfers have a category too (e.g., 'Internal')
          type: { $first: '$type' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          name: '$categoryInfo.name',
          amount: 1,
          type: 1,
          monthlyBudget: '$categoryInfo.monthlyBudget',
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // 3. Comparison with previous month
    const startOfPrevMonth = new Date(year, month - 2, 1);
    const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59);

    const matchPrev: any = { 
        userId: new Types.ObjectId(userId), 
        date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } 
    };

    if (walletId) {
        matchPrev.walletId = new Types.ObjectId(walletId);
    }

    const prevTotals = await this.transactionModel.aggregate([
      { $match: matchPrev },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const prevExpenses = prevTotals.find(t => t._id === 'expense')?.total || 0;
    const expenseDiff = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

    // 4. Prediction for end of month
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    let predictedBalance = income - expenses;

    if (isCurrentMonth) {
      const subscriptions = await this.subscriptionModel.find({ userId: match.userId, isActive: true });
      const remainingSubs = subscriptions
        .filter(s => s.billingDate > today.getDate())
        .reduce((sum, s) => sum + s.amount, 0);
      predictedBalance -= remainingSubs;
    }

    // 5. Wallet Breakdown at the end of the period
    const walletBreakdown = await this.getWalletSpread(userId, endOfMonth);

    return {
      month,
      year,
      totals: { income, expenses, balance: income - expenses },
      prediction: { endOfMonthBalance: predictedBalance },
      categoryBreakdown,
      walletBreakdown,
      comparison: {
        prevMonthExpenses: prevExpenses,
        diffPercentage: parseFloat(expenseDiff.toFixed(2)),
      },
    };
  }

  /**
   * Calculates the balance of each wallet at a specific date
   */
  async getWalletSpread(userId: string, date: Date) {
    const wallets = await this.walletModel.find({ userId: new Types.ObjectId(userId) }).exec();
    
    return Promise.all(wallets.map(async (wallet) => {
      const walletIdObj = wallet._id as Types.ObjectId;
      
      const result = await this.transactionModel.aggregate([
        { 
          $match: { 
            userId: new Types.ObjectId(userId),
            date: { $lte: date },
            $or: [{ walletId: walletIdObj }, { toWalletId: walletIdObj }]
          } 
        },
        {
          $project: {
            amount: 1,
            isOutflow: {
              $or: [
                { $eq: ['$type', 'expense'] },
                { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$walletId', walletIdObj] }] },
              ],
            },
            isInflow: {
              $or: [
                { $eq: ['$type', 'income'] },
                { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$toWalletId', walletIdObj] }] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
            totalOutflow: { $sum: { $cond: ['$isOutflow', '$amount', 0] } },
          },
        },
      ]);

      const totalIncome = result[0]?.totalInflow || 0;
      const totalExpense = result[0]?.totalOutflow || 0;
      const initialBalance = wallet.initialBalance || 0;
      const currentBalance = initialBalance + totalIncome - totalExpense;

      return {
        id: wallet._id,
        name: wallet.name,
        type: wallet.type,
        balance: currentBalance
      };
    }));
  }

  async getAnnualAnalysis(userId: string, year: number, walletId?: string) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const match: any = {
      userId: new Types.ObjectId(userId),
      date: { $gte: startOfYear, $lte: endOfYear },
    };

    if (walletId) {
      match.walletId = new Types.ObjectId(walletId);
    }

    const trendMatch = !walletId
      ? { ...match, type: { $in: ['income', 'expense'] } }
      : {
          userId: match.userId,
          date: match.date,
          $or: [{ walletId: new Types.ObjectId(walletId) }, { toWalletId: new Types.ObjectId(walletId) }],
        };

    // 1. Calculate Starting Balance (before startOfYear)
    // - Sum initialBalance of relevant wallets
    // - Sum all flows before startOfYear
    const walletsMatch: any = { userId: new Types.ObjectId(userId) };
    if (walletId) walletsMatch._id = new Types.ObjectId(walletId);
    const wallets = await this.walletModel.find(walletsMatch);
    const sumInitialBalances = wallets.reduce((sum, w) => sum + (w.initialBalance || 0), 0);

    const historyMatch: any = {
      userId: new Types.ObjectId(userId),
      date: { $lt: startOfYear },
    };

    if (walletId) {
      historyMatch.$or = [
        { walletId: new Types.ObjectId(walletId) }, 
        { toWalletId: new Types.ObjectId(walletId) }
      ];
    } else {
      historyMatch.type = { $in: ['income', 'expense'] };
    }

    const preHistory = await this.transactionModel.aggregate([
      { $match: historyMatch },
      {
        $project: {
          amount: 1,
          isOutflow: walletId ? {
            $or: [
              { $eq: ['$type', 'expense'] },
              { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$walletId', new Types.ObjectId(walletId)] }] },
            ],
          } : { $eq: ['$type', 'expense'] },
          isInflow: walletId ? {
            $or: [
              { $eq: ['$type', 'income'] },
              { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$toWalletId', new Types.ObjectId(walletId)] }] },
            ],
          } : { $eq: ['$type', 'income'] },
        },
      },
      {
        $group: {
          _id: null,
          totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
          totalOutflow: { $sum: { $cond: ['$isOutflow', '$amount', 0] } },
        },
      },
    ]);

    const historicalNet = (preHistory[0]?.totalInflow || 0) - (preHistory[0]?.totalOutflow || 0);
    let runningBalance = sumInitialBalances + historicalNet;

    // 2. Monthly Trend for the selected year
    const trend = await this.transactionModel.aggregate([
      { $match: trendMatch },
      {
        $project: {
          month: { $month: '$date' },
          amount: 1,
          type: 1,
          isOutflow: walletId ? {
            $or: [
              { $eq: ['$type', 'expense'] },
              { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$walletId', new Types.ObjectId(walletId)] }] },
            ],
          } : { $eq: ['$type', 'expense'] },
          isInflow: walletId ? {
            $or: [
              { $eq: ['$type', 'income'] },
              { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$toWalletId', new Types.ObjectId(walletId)] }] },
            ],
          } : { $eq: ['$type', 'income'] },
        },
      },
      {
        $group: {
          _id: '$month',
          income: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
          expenses: { $sum: { $cond: ['$isOutflow', '$amount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format for easier front consumption (array of 12 months)
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expenses: 0,
      balance: 0,
    }));

    trend.forEach((t) => {
      const monthIndex = t._id - 1;
      monthlyTrend[monthIndex].income = t.income;
      monthlyTrend[monthIndex].expenses = t.expenses;
    });

    // Calculate Cumulative Balance
    monthlyTrend.forEach((m) => {
      runningBalance += m.income - m.expenses;
      m.balance = runningBalance;
    });

    return monthlyTrend;
  }

  async getFinancialHealth(userId: string) {
    const now = new Date();
    const currentMonthData = await this.getMonthlyAnalysis(userId, now.getMonth() + 1, now.getFullYear());
    
    const { income, expenses } = currentMonthData.totals;
    const tips: Array<{ title: string; message: string; type: 'success' | 'warning' | 'info' }> = [];
    
    // 1. 50/30/20 Rule Analysis (Simplified heuristic)
    // We assume categories like Rent, Bills, Food are "Needs" (50%)
    // Items like Shopping, Entertainment are "Wants" (30%)
    // Rest is Savings (20%)
    const needsCategories = ['Loyauté', 'Factures', 'Santé', 'Transport', 'Logement', 'Alimentation'];
    const wantsCategories = ['Loisirs', 'Shopping', 'Cadeaux', 'Restaurants'];

    const needsAmount = currentMonthData.categoryBreakdown
      .filter(c => needsCategories.includes(c.name) && c.type === 'expense')
      .reduce((sum, c) => sum + c.amount, 0);

    const wantsAmount = currentMonthData.categoryBreakdown
      .filter(c => wantsCategories.includes(c.name) && c.type === 'expense')
      .reduce((sum, c) => sum + c.amount, 0);

    const savingsAmount = income - expenses;

    const needsPct = income > 0 ? (needsAmount / income) * 100 : 0;
    const wantsPct = income > 0 ? (wantsAmount / income) * 100 : 0;
    const savingsPct = income > 0 ? (savingsAmount / income) * 100 : 0;

    if (needsPct > 55) {
      tips.push({
        title: 'Besoins élevés',
        message: `Vos charges fixes (${needsPct.toFixed(0)}%) dépassent le cap conseillé de 50%. Essayez de renégocier certains abonnements.`,
        type: 'warning',
      });
    }

    if (wantsPct > 35) {
      tips.push({
        title: 'Envies à surveiller',
        message: `Vos loisirs représentent ${wantsPct.toFixed(0)}% de vos revenus. Une petite réduction ici pourrait booster votre épargne !`,
        type: 'info',
      });
    }

    if (savingsPct < 15 && income > 0) {
      tips.push({
        title: 'Épargne faible',
        message: "Vous épargnez moins de 20% de vos revenus. Essayez de mettre de côté dès le début du mois (Pay yourself first).",
        type: 'warning',
      });
    } else if (savingsPct >= 20) {
      tips.push({
        title: 'Excellent équilibre',
        message: "Bravo ! Vous respectez ou dépassez l'objectif de 20% d'épargne. Continuez ainsi.",
        type: 'success',
      });
    }

    // 2. Remaining to live and Subscriptions
    const subscriptions = await this.subscriptionModel.find({ userId: new Types.ObjectId(userId), isActive: true });
    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    const remainingToLive = income - needsAmount - totalSubscriptions;

    if (totalSubscriptions > income * 0.15 && income > 0) {
      tips.push({
        title: 'Charges fixes élevées',
        message: `Vos abonnements représentent ${((totalSubscriptions / income) * 100).toFixed(0)}% de vos revenus. Vérifiez si certains sont superflus.`,
        type: 'warning',
      });
    }

    // Top 3 expenses
    const topExpenses = currentMonthData.categoryBreakdown
      .filter(c => c.type === 'expense')
      .slice(0, 3);

    return {
      rule503020: { needsPct, wantsPct, savingsPct },
      remainingToLive,
      totalSubscriptions,
      topExpenses,
      tips,
    };
  }
}
