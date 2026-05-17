import { IsString, IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'Netflix' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 15.99, minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'ID MongoDB de la catégorie' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID MongoDB du portefeuille' })
  @IsString()
  @IsOptional()
  walletId?: string;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 31 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  billingDate?: number;

  @ApiPropertyOptional({ example: 'Abonnement mensuel' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
