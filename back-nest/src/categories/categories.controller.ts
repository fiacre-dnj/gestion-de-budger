import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CategoryType } from './schemas/category.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query('type') type?: CategoryType,
  ) {
    return this.categoriesService.findAll(req.user.userId, type);
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.categoriesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.user.userId, id, updateCategoryDto);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.categoriesService.remove(req.user.userId, id);
    return { message: 'Category deleted successfully' };
  }
}
