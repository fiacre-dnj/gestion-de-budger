import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { TransactionType } from '../schemas/transaction.schema';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(['income', 'expense', 'transfer'])
  type?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
