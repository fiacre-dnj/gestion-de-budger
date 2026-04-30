import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument, CategoryType, DEFAULT_CATEGORIES } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async createDefaultCategories(userId: string): Promise<void> {
    const categories = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      userId: new Types.ObjectId(userId),
    }));
    await this.categoryModel.insertMany(categories);
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
    const category = new this.categoryModel({
      ...createCategoryDto,
      userId: new Types.ObjectId(userId),
      isDefault: false,
    });
    return category.save();
  }

  async findAll(userId: string, type?: CategoryType): Promise<CategoryDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (type) {
      query.type = type;
    }
    return this.categoryModel.find(query).sort({ name: 1 });
  }

  async findOne(userId: string, id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    
    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }
    
    return category;
  }

  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    Object.assign(category, updateCategoryDto);
    return category.save();
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    await this.categoryModel.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
