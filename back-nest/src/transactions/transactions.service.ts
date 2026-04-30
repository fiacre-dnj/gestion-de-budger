import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WalletsService } from '../wallets/wallets.service';

interface QueryFilters {
  userId: Types.ObjectId;
  type?: TransactionType;
  category?: Types.ObjectId;
  walletId?: Types.ObjectId;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private walletsService: WalletsService,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
    // Ensure wallet exists or get default
    let walletId = createTransactionDto.walletId;
    if (!walletId) {
      const defaultWallet = await this.walletsService.ensureDefaultWallet(userId);
      walletId = defaultWallet._id.toString();
    }

    const transactionData: any = {
      ...createTransactionDto,
      userId: new Types.ObjectId(userId),
      walletId: new Types.ObjectId(walletId),
      date: new Date(createTransactionDto.date),
    };

    if (createTransactionDto.category) {
      transactionData.category = new Types.ObjectId(createTransactionDto.category);
    }
    
    if (createTransactionDto.toWalletId) {
      transactionData.toWalletId = new Types.ObjectId(createTransactionDto.toWalletId);
    }

    const transaction = new this.transactionModel(transactionData);
    return transaction.save();
  }

  async findAll(
    userId: string,
    filters?: {
      type?: TransactionType;
      category?: string;
      walletId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<TransactionDocument[]> {
    const query: QueryFilters = { userId: new Types.ObjectId(userId) };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.category) {
      query.category = new Types.ObjectId(filters.category);
    }

    if (filters?.walletId) {
      query.walletId = new Types.ObjectId(filters.walletId);
    }

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    return this.transactionModel
      .find(query)
      .populate('category', 'name type')
      .sort({ date: -1 });
  }

  async findOne(userId: string, id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .populate('category', 'name type');

    if (!transaction) {
      throw new NotFoundException('Transaction non trouvée');
    }

    return transaction;
  }

  async update(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDocument> {
    const updateData: any = { ...updateTransactionDto };
    
    if (updateTransactionDto.category) {
      updateData.category = new Types.ObjectId(updateTransactionDto.category);
    }

    if (updateTransactionDto.walletId) {
      updateData.walletId = new Types.ObjectId(updateTransactionDto.walletId);
    }
    
    if (updateTransactionDto.date) {
      updateData.date = new Date(updateTransactionDto.date);
    }

    const transaction = await this.transactionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      updateData,
      { new: true },
    ).populate('category', 'name type');

    if (!transaction) {
      throw new NotFoundException('Transaction non trouvée');
    }

    return transaction;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.transactionModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Transaction non trouvée');
    }
  }

  async getSummary(userId: string, walletId?: string): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }> {
    const userIdObj = new Types.ObjectId(userId);
    
    // In global view (no walletId), we ignore transfers as they are internal.
    // In wallet view, we count transfers from this wallet as expense and to this wallet as income.
    
    if (!walletId) {
      const [transactionsResult, initialBalancesResult] = await Promise.all([
        this.transactionModel.aggregate([
          { $match: { userId: userIdObj, type: { $in: ['income', 'expense'] } } },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
            },
          },
        ]),
        this.walletsService.findAll(userId).then(wallets => 
          wallets.reduce((sum, w) => sum + (w.initialBalance || 0), 0)
        ),
      ]);

      const income = transactionsResult.find((r) => r._id === 'income')?.total || 0;
      const expense = transactionsResult.find((r) => r._id === 'expense')?.total || 0;

      return {
        totalIncome: income,
        totalExpense: expense,
        balance: initialBalancesResult + income - expense,
      };
    }

    const walletIdObj = new Types.ObjectId(walletId);
    const wallet = await this.walletsService.findOne(walletId, userId);
    const initialBalance = wallet.initialBalance || 0;

    const match: any = { userId: userIdObj };

    const result = await this.transactionModel.aggregate([
      { 
        $match: {
          $or: [
            { walletId: walletIdObj },
            { toWalletId: walletIdObj }
          ]
        }
      },
      {
        $project: {
          amount: 1,
          type: 1,
          isOutflow: {
            $or: [
              { $eq: ['$type', 'expense'] },
              { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$walletId', walletIdObj] }] }
            ]
          },
          isInflow: {
            $or: [
              { $eq: ['$type', 'income'] },
              { $and: [{ $eq: ['$type', 'transfer'] }, { $eq: ['$toWalletId', walletIdObj] }] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalInflow: { $sum: { $cond: ['$isInflow', '$amount', 0] } },
          totalOutflow: { $sum: { $cond: ['$isOutflow', '$amount', 0] } }
        }
      }
    ]);
    const totalIncome = result[0]?.totalInflow || 0;
    const totalExpense = result[0]?.totalOutflow || 0;

    return {
      totalIncome,
      totalExpense,
      balance: initialBalance + totalIncome - totalExpense,
    };
  }

  async getTransactionsForExport(
    userId: string,
    filters?: {
      type?: TransactionType;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<any[]> {
    const query: QueryFilters = { userId: new Types.ObjectId(userId) };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    return this.transactionModel
      .find(query)
      .populate('category', 'name')
      .sort({ date: -1 })
      .lean();
  }
}
