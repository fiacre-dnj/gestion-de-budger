import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

export enum WalletType {
  BANK = 'bank',
  CASH = 'cash',
  SAVINGS = 'savings',
}

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: WalletType, default: WalletType.BANK })
  type: WalletType;

  @Prop({ required: true, default: 0 })
  initialBalance: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ userId: 1 });
