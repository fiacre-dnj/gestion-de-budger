import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavingGoal, SavingGoalDocument } from './schemas/saving-goal.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../categories/schemas/category.schema';
import { TransactionType } from '../transactions/schemas/transaction.schema';

@Injectable()
export class SavingsService {
  constructor(
    @InjectModel(SavingGoal.name) private savingGoalModel: Model<SavingGoalDocument>,
    private transactionsService: TransactionsService,
    private categoriesService: CategoriesService,
  ) {}

  async findAll(userId: string) {
    const goals = await this.savingGoalModel.find({ userId: new Types.ObjectId(userId) }).sort({ deadline: 1 }).exec();
    
    // Calculate projections for each goal
    const projectedGoals = await Promise.all(goals.map(async goal => {
      const projection = await this.calculateProjection(userId, goal);
      return {
        ...goal.toObject(),
        estimatedDate: projection.estimatedDate,
        monthlySpeed: projection.monthlySpeed,
      };
    }));

    return projectedGoals;
  }

  private async calculateProjection(userId: string, goal: SavingGoalDocument) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Find transactions for this goal in the last 3 months
    const transactions = await this.transactionsService.findAll(userId, {
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      // Filter by title matching the goal
    });

    const goalTransactions = transactions.filter(t => 
      t.title.includes(`Épargne : ${goal.title}`) || 
      t.description?.includes(`Contribution à l'objectif : ${goal.title}`)
    );

    const totalContribution = goalTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlySpeed = totalContribution / 3;

    if (monthlySpeed <= 0) {
      return { estimatedDate: null, monthlySpeed: 0 };
    }

    const remainingAmount = goal.targetAmount - goal.currentAmount;
    if (remainingAmount <= 0) {
      return { estimatedDate: new Date(), monthlySpeed };
    }

    const monthsToFinish = remainingAmount / monthlySpeed;
    const estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + Math.ceil(monthsToFinish));

    return { estimatedDate, monthlySpeed };
  }

  async findOne(id: string, userId: string) {
    const goal = await this.savingGoalModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (!goal) throw new NotFoundException('Objectif d\'épargne non trouvé');
    return goal;
  }

  async create(userId: string, data: Partial<SavingGoal>) {
    const newGoal = new this.savingGoalModel({
      ...data,
      userId: new Types.ObjectId(userId),
    });
    return newGoal.save();
  }

  async update(id: string, userId: string, data: Partial<SavingGoal>) {
    const goal = await this.savingGoalModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true },
    ).exec();
    if (!goal) throw new NotFoundException('Objectif d\'épargne non trouvé');
    return goal;
  }

  async remove(id: string, userId: string) {
    const result = await this.savingGoalModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Objectif d\'épargne non trouvé');
    return { success: true };
  }

  async addContribution(id: string, userId: string, amount: number) {
    // 1. Find or create "Épargne" category
    const categories = await this.categoriesService.findAll(userId, CategoryType.EXPENSE);
    let savingCategory = categories.find(c => c.name === 'Épargne');
    
    if (!savingCategory) {
      savingCategory = await this.categoriesService.create(userId, {
        name: 'Épargne',
        type: CategoryType.EXPENSE,
      });
    }

    // 2. Fetch the goal to get its title
    const goal = await this.savingGoalModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (!goal) throw new NotFoundException('Objectif d\'épargne non trouvé');

    // 3. Create the expense transaction
    await this.transactionsService.create(userId, {
      title: `Épargne : ${goal.title}`,
      amount: amount,
      type: TransactionType.EXPENSE,
      category: savingCategory._id.toString(),
      date: new Date().toISOString().split('T')[0],
      description: `Contribution à l'objectif : ${goal.title}`,
    });

    // 4. Update the goal currentAmount
    goal.currentAmount += amount;
    return goal.save();
  }
}
