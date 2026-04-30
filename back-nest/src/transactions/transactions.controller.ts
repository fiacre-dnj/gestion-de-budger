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
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '../auth/auth.guard';
import { TransactionType } from './schemas/transaction.schema';
import { Request } from 'express';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const { format } = require('@fast-csv/format');

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query('type') type?: TransactionType,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.findAll(req.user.userId, {
      type,
      category,
      startDate,
      endDate,
    });
  }

  @Get('summary')
  async getSummary(@Req() req: RequestWithUser, @Query('walletId') walletId?: string) {
    return this.transactionsService.getSummary(req.user.userId, walletId);
  }

  @Get('export')
  async export(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
    @Query('type') type?: TransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const transactions = await this.transactionsService.getTransactionsForExport(
      req.user.userId,
      { type, startDate, endDate },
    );

    // Create CSV with French headers and semicolon delimiter for Excel FR
    const csvStream = format({ headers: true, delimiter: ';' });

    // Transform transactions to CSV rows with French labels
    const rows = transactions.map((t: any) => ({
      'Date': new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'Titre': t.title,
      'Type': t.type === 'income' ? 'Revenu' : 'Depense',
      'Categorie': t.category?.name || 'Non categorise',
      'Montant': t.amount.toFixed(2).replace('.', ','),
      'Description': t.description || '',
    }));

    // Set headers for file download with UTF-8 BOM
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');

    // Write UTF-8 BOM first so Excel recognizes encoding
    res.write('\uFEFF');

    // Pipe CSV to response
    csvStream.pipe(res);
    
    rows.forEach(row => csvStream.write(row));
    csvStream.end();
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.userId, id, updateTransactionDto);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.transactionsService.remove(req.user.userId, id);
    return { message: 'Transaction deleted successfully' };
  }
}
