import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  billingDate: number;

  @IsString()
  @IsOptional()
  description?: string;
}
