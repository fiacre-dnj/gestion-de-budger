import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('import')
@UseGuards(AuthGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() req: RequestWithUser,
    @UploadedFile() file: any,
  ) {
    return this.importService.parseCsv(req.user.userId, file.buffer);
  }
}
