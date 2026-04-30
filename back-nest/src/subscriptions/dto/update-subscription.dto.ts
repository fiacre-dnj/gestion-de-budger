import { IsString, IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  walletId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  billingDate?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
