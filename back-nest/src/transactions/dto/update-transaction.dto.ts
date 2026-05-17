import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'Courses supermarché' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 45.5, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: ['income', 'expense', 'transfer'] })
  @IsOptional()
  @IsEnum(['income', 'expense', 'transfer'])
  type?: string;

  @ApiPropertyOptional({ description: 'ID MongoDB de la catégorie' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'ID MongoDB du portefeuille' })
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({ example: 'Achat hebdomadaire' })
  @IsOptional()
  @IsString()
  description?: string;
}
