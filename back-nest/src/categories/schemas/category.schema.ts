import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: CategoryType })
  type: CategoryType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ required: false, min: 0 })
  monthlyBudget?: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Default categories for new users (French)
export const DEFAULT_CATEGORIES = [
  // Revenus (Income)
  { name: 'Salaire', type: CategoryType.INCOME, isDefault: true },
  { name: 'Freelance', type: CategoryType.INCOME, isDefault: true },
  { name: 'Investissements', type: CategoryType.INCOME, isDefault: true },
  { name: 'Autres revenus', type: CategoryType.INCOME, isDefault: true },
  // Dépenses (Expenses)
  { name: 'Alimentation', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Transport', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Logement', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Loisirs', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Santé', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Shopping', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Factures', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Restaurants', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Éducation', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Autres dépenses', type: CategoryType.EXPENSE, isDefault: true },
];
