import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'Netflix' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 15.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'ID MongoDB de la catégorie' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'ID MongoDB du portefeuille' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ example: 15, minimum: 1, maximum: 31, description: 'Jour de prélèvement' })
  @IsNumber()
  @Min(1)
  @Max(31)
  billingDate: number;

  @ApiPropertyOptional({ example: 'Abonnement mensuel' })
  @IsString()
  @IsOptional()
  description?: string;
}
