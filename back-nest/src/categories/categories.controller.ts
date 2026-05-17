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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CategoryType } from './schemas/category.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une catégorie' })
  @ApiCreatedResponse({ description: 'Catégorie créée' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les catégories' })
  @ApiQuery({ name: 'type', enum: CategoryType, required: false })
  @ApiOkResponse({ description: 'Liste des catégories' })
  async findAll(
    @Req() req: RequestWithUser,
    @Query('type') type?: CategoryType,
  ) {
    return this.categoriesService.findAll(req.user.userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une catégorie par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de la catégorie' })
  @ApiOkResponse({ description: 'Détail de la catégorie' })
  @ApiNotFoundResponse({ description: 'Catégorie introuvable' })
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.categoriesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une catégorie' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de la catégorie' })
  @ApiOkResponse({ description: 'Catégorie mise à jour' })
  @ApiNotFoundResponse({ description: 'Catégorie introuvable' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.user.userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de la catégorie' })
  @ApiOkResponse({ description: 'Catégorie supprimée' })
  @ApiNotFoundResponse({ description: 'Catégorie introuvable' })
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.categoriesService.remove(req.user.userId, id);
    return { message: 'Category deleted successfully' };
  }
}
