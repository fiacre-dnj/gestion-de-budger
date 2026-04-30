import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  category?: Types.ObjectId;

  @Prop({ required: true, enum: ['income', 'expense', 'transfer'] })
  type: string;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: false })
  toWalletId?: Types.ObjectId;

  @Prop({ default: '' })
  description: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Index for efficient querying
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ walletId: 1 });
