import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { CategoryType } from '../schemas/category.schema';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudget?: number;
}
