import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { AvaliacaoService, AvaliacaoDto } from '../services/avaliacao.service';

@ApiTags('Receitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receitas')
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @Post(':id/avaliar')
  @ApiOperation({ summary: 'Avaliar uma receita (1-5 estrelas) com comentário opcional' })
  avaliar(
    @Param('id') receitaId: string,
    @CurrentUser() user: Usuario,
    @Body() dto: AvaliacaoDto,
  ) {
    return this.avaliacaoService.avaliar(receitaId, user.id, dto);
  }

  @Get(':id/comentarios')
  @ApiOperation({ summary: 'Listar comentários públicos de uma receita' })
  listarComentarios(@Param('id') receitaId: string) {
    return this.avaliacaoService.listarComentarios(receitaId);
  }

  @Get(':id/minha-avaliacao')
  @ApiOperation({ summary: 'Buscar minha avaliação para uma receita' })
  minhaAvaliacao(
    @Param('id') receitaId: string,
    @CurrentUser() user: Usuario,
  ) {
    return this.avaliacaoService.minhaAvaliacao(receitaId, user.id);
  }
}
