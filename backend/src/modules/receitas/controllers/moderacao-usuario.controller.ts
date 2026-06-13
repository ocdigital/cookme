import {
  Controller, Post, Param, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { ModeracaoService } from '../services/moderacao.service';
import { UploadService } from '@modules/upload/upload.service';
import { memoryStorage } from 'multer';

const MIME_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

@ApiTags('Receitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receitas')
export class ModeracaoUsuarioController {
  constructor(
    private readonly moderacaoService: ModeracaoService,
    private readonly uploadService: UploadService,
  ) {}

  @Post(':id/sugerir-foto')
  @ApiOperation({ summary: 'Usuário envia foto tirada pelo celular para sugerir nova imagem da receita' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (MIME_PERMITIDOS.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException(`Formato não suportado: ${file.mimetype}`), false);
    },
  }))
  async sugerirFoto(
    @CurrentUser() user: Usuario,
    @Param('id') receitaId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhuma imagem enviada');

    // Faz upload para o R2 antes de registrar a sugestão
    const fotoUrl = await this.uploadService.uploadImagem(
      file.buffer,
      file.originalname,
      file.mimetype,
      'receitas/fotos-comunidade',
    );

    return this.moderacaoService.sugerirFoto(receitaId, user.id, fotoUrl);
  }
}
