import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../schemas/category.schema';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Alimentation' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({ example: 500, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudget?: number;
}
