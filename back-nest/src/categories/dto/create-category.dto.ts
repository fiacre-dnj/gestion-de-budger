import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../schemas/category.schema';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentation' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 500, minimum: 0, description: 'Budget mensuel' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudget?: number;
}
