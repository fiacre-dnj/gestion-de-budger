import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { TransactionType } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(['income', 'expense', 'transfer'])
  type: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @IsOptional()
  walletId?: string;

  @IsOptional()
  @IsString()
  toWalletId?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;
}
