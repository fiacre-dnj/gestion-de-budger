import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletType } from '../schemas/wallet.schema';

export class CreateWalletDto {
  @ApiProperty({ example: 'Compte Courant' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: WalletType, default: WalletType.BANK })
  @IsEnum(WalletType)
  @IsOptional()
  type?: WalletType;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  initialBalance?: number;
}

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: 'Compte Courant' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: WalletType })
  @IsEnum(WalletType)
  @IsOptional()
  type?: WalletType;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @IsOptional()
  initialBalance?: number;
}
