import { Injectable, BadRequestException } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoriesService } from '../categories/categories.service';
import * as csv from 'fast-csv';
import { Readable } from 'stream';

@Injectable()
export class ImportService {
  constructor(
    private transactionsService: TransactionsService,
    private categoriesService: CategoriesService,
  ) {}

  async parseCsv(userId: string, fileBuffer: Buffer) {
    const results: any[] = [];
    const stream = Readable.from(fileBuffer);

    return new Promise((resolve, reject) => {
      csv.parseStream(stream, { headers: true, delimiter: ';' }) // Common French bank CSV delimiter
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            const mappedTransactions = await this.mapCsvToTransactions(userId, results);
            resolve(mappedTransactions);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (error) => reject(new BadRequestException('Erreur lors du parsing CSV: ' + error.message)));
    });
  }

  private async mapCsvToTransactions(userId: string, data: any[]) {
    // Basic mapping: Date;Description;Amount;Category
    // This is a simplified version, ideally we want user to map columns in frontend
    const categories = await this.categoriesService.findAll(userId);
    const defaultCategory = categories[0];

    return data.map(row => ({
      date: this.parseDate(row.Date || row.date),
      description: row.Description || row.description || row.Libellé || row.libelle,
      amount: parseFloat((row.Amount || row.amount || row.Montant || row.montant || '0').replace(',', '.')),
      type: parseFloat((row.Amount || row.amount || row.Montant || row.montant || '0').replace(',', '.')) >= 0 ? 'income' : 'expense',
      categoryId: this.matchCategory(row.Category || row.category || row.Description, categories) || defaultCategory?._id,
    }));
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    // Try DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  }

  private matchCategory(text: string, categories: any[]) {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    const match = categories.find(c => lowerText.includes(c.name.toLowerCase()));
    return match ? match._id : null;
  }
}
