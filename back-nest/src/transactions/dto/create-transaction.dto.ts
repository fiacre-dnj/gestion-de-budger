import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Courses supermarché' })
  @IsString()
  title: string;

  @ApiProperty({ example: 45.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['income', 'expense', 'transfer'], example: 'expense' })
  @IsEnum(['income', 'expense', 'transfer'])
  type: string;

  @ApiPropertyOptional({ description: 'ID MongoDB de la catégorie' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'ID MongoDB du portefeuille source' })
  @IsString()
  @IsOptional()
  walletId?: string;

  @ApiPropertyOptional({ description: 'ID MongoDB du portefeuille destination (virement)' })
  @IsOptional()
  @IsString()
  toWalletId?: string;

  @ApiProperty({ example: '2026-04-30' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Achat hebdomadaire' })
  @IsOptional()
  @IsString()
  description?: string;
}
