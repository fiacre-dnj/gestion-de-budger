import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SavingGoalDocument = SavingGoal & Document;

@Schema({ timestamps: true })
export class SavingGoal {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  targetAmount: number;

  @Prop({ required: true, min: 0, default: 0 })
  currentAmount: number;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ default: '#4f46e5' })
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const SavingGoalSchema = SchemaFactory.createForClass(SavingGoal);

// Index for efficient querying
SavingGoalSchema.index({ userId: 1, deadline: 1 });
