import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { WalletType } from '../schemas/wallet.schema';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsEnum(WalletType)
  @IsOptional()
  type?: WalletType;

  @IsNumber()
  @IsOptional()
  initialBalance?: number;
}

export class UpdateWalletDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(WalletType)
  @IsOptional()
  type?: WalletType;

  @IsNumber()
  @IsOptional()
  initialBalance?: number;
}
