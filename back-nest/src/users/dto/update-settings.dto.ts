import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'EUR', description: 'Devise par défaut de l\'utilisateur' })
  @IsOptional()
  @IsString()
  currency?: string;
}
