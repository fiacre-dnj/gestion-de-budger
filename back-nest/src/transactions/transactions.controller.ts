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
  Res,
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
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { format } = require('@fast-csv/format');

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une transaction' })
  @ApiCreatedResponse({ description: 'Transaction créée' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les transactions avec filtres' })
  @ApiQuery({ name: 'type', enum: ['income', 'expense', 'transfer'], required: false })
  @ApiQuery({ name: 'category', required: false, description: 'ID MongoDB de la catégorie' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-12-31' })
  @ApiOkResponse({ description: 'Liste des transactions' })
  async findAll(
    @Req() req: RequestWithUser,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.findAll(req.user.userId, {
      type: type as any,
      category,
      startDate,
      endDate,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Résumé des revenus et dépenses' })
  @ApiQuery({ name: 'walletId', required: false, description: 'Filtrer par portefeuille' })
  @ApiOkResponse({ description: 'Totaux revenus, dépenses et solde' })
  async getSummary(@Req() req: RequestWithUser, @Query('walletId') walletId?: string) {
    return this.transactionsService.getSummary(req.user.userId, walletId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter les transactions en CSV' })
  @ApiProduces('text/csv')
  @ApiQuery({ name: 'type', enum: ['income', 'expense', 'transfer'], required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiOkResponse({ description: 'Fichier CSV (séparateur point-virgule, UTF-8 BOM)' })
  async export(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const transactions = await this.transactionsService.getTransactionsForExport(
      req.user.userId,
      { type: type as any, startDate, endDate },
    );

    const csvStream = format({ headers: true, delimiter: ';' });

    const rows = transactions.map((t: any) => ({
      'Date': new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'Titre': t.title,
      'Type': t.type === 'income' ? 'Revenu' : 'Depense',
      'Categorie': t.category?.name || 'Non categorise',
      'Montant': t.amount.toFixed(2).replace('.', ','),
      'Description': t.description || '',
    }));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.write('\uFEFF');
    csvStream.pipe(res);

    rows.forEach(row => csvStream.write(row));
    csvStream.end();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une transaction par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de la transaction' })
  @ApiOkResponse({ description: 'Détail de la transaction' })
  @ApiNotFoundResponse({ description: 'Transaction introuvable' })
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une transaction' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de la transaction' })
  @ApiOkResponse({ description: 'Transaction mise à jour' })
  @ApiNotFoundResponse({ description: 'Transaction introuvable' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.userId, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une transaction' })
  @ApiParam({ name: 'id', description: 'ID MongoDB de la transaction' })
  @ApiOkResponse({ description: 'Transaction supprimée' })
  @ApiNotFoundResponse({ description: 'Transaction introuvable' })
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.transactionsService.remove(req.user.userId, id);
    return { message: 'Transaction deleted successfully' };
  }
}
