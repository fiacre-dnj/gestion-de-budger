import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('Import')
@ApiBearerAuth('access-token')
@Controller('import')
@UseGuards(AuthGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importer et prévisualiser un fichier CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier CSV de transactions',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Lignes parsées prêtes à être importées' })
  @ApiBadRequestResponse({ description: 'Fichier invalide ou format incorrect' })
  async importCsv(
    @Req() req: RequestWithUser,
    @UploadedFile() file: { buffer: Buffer },
  ) {
    return this.importService.parseCsv(req.user.userId, file.buffer);
  }
}
