import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavingGoalDto {
  @ApiProperty({ example: 'Vacances été' })
  @IsString()
  title: string;

  @ApiProperty({ example: 5000, minimum: 0 })
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({ example: '#4f46e5', default: '#4f46e5' })
  @IsOptional()
  @IsString()
  color?: string;
}
