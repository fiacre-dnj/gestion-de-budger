import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { CategoryType } from '../schemas/category.schema';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsOptional()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudget?: number;
}
