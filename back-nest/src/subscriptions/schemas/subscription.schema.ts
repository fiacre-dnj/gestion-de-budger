import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  billingDate: number; // Day of the month (1-31)

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
