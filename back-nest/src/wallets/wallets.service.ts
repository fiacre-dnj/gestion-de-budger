import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument, WalletType } from './schemas/wallet.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(userId: string, createWalletDto: CreateWalletDto): Promise<WalletDocument> {
    const createdWallet = new this.walletModel({
      ...createWalletDto,
      userId: new Types.ObjectId(userId),
    });
    return createdWallet.save();
  }

  async findAll(userId: string): Promise<any[]> {
    const wallets = await this.walletModel.find({ userId: new Types.ObjectId(userId) }).exec();
    
    // We'll return the wallet data plus some calculated fields
    return Promise.all(wallets.map(async (wallet) => {
      const summary = await this.getWalletBalance(userId, wallet._id.toString());
      return {
        ...wallet.toObject(),
        currentBalance: summary.balance,
      };
    }));
  }

  // Helper to calculate balance for a specific wallet
  private async getWalletBalance(userId: string, walletId: string): Promise<{ balance: number }> {
    const userIdObj = new Types.ObjectId(userId);
    const walletIdObj = new Types.ObjectId(walletId);
    
    const wallet = await this.walletModel.findById(walletId);
    if (!wallet) return { balance: 0 };
    
    const initialBalance = wallet.initialBalance || 0;

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

    return { balance: initialBalance + totalIncome - totalExpense };
  }

  async findOne(id: string, userId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async update(id: string, userId: string, updateWalletDto: UpdateWalletDto): Promise<WalletDocument> {
    const updatedWallet = await this.walletModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      updateWalletDto,
      { new: true },
    ).exec();

    if (!updatedWallet) {
      throw new NotFoundException('Wallet not found');
    }
    return updatedWallet;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.walletModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Wallet not found');
    }
  }

  async ensureDefaultWallet(userId: string): Promise<WalletDocument> {
    const existing = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!existing) {
      return this.create(userId, {
        name: 'Portefeuille Principal',
        type: WalletType.BANK,
        initialBalance: 0,
      });
    }
    return existing;
  }
}
