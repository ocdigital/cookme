import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { memoryStorage } from 'multer';

const MIME_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const TAMANHO_MAX = 10 * 1024 * 1024; // 10MB

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('imagem')
  @ApiOperation({ summary: 'Faz upload de imagem para o R2 e retorna a URL pública' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: TAMANHO_MAX },
    fileFilter: (_, file, cb) => {
      if (MIME_PERMITIDOS.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Formato não suportado: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadImagem(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    const url = await this.uploadService.uploadImagem(
      file.buffer,
      file.originalname,
      file.mimetype,
      'receitas/fotos-comunidade',
    );

    return { url };
  }
}
