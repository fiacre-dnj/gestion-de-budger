import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSavingGoalDto {
  @ApiPropertyOptional({ example: 'Vacances été' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 5000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ example: 1200, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: '#4f46e5' })
  @IsOptional()
  @IsString()
  color?: string;
}
