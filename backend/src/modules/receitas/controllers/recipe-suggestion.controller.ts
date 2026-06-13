import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RecipeSuggestionService, SuggestionResult, ReceitaParaMimResult, ReceitaDesafioResult } from '../services/recipe-suggestion.service';

@ApiTags('Receitas')
@ApiBearerAuth()
@Controller('receitas/sugestoes')
@UseGuards(JwtAuthGuard)
export class RecipeSuggestionController {
  private readonly logger = new Logger(RecipeSuggestionController.name);

  constructor(
    private readonly recipeSuggestionService: RecipeSuggestionService,
  ) {}

  /**
   * GET /api/receitas/sugestoes
   *
   * Sugere receitas baseado nos ingredientes disponíveis no inventário do usuário
   *
   * Response:
   * {
   *   "total_ingredientes_disponiveis": 5,
   *   "receitas_sugeridas": [
   *     {
   *       "titulo": "Frittata com ovo, tomate e cebola",
   *       "url": "https://...",
   *       "ingredientes_match": ["ovo", "tomate"],
   *       "fonte": "google_search",
   *       "data_sugestao": "2025-01-04T..."
   *     }
   *   ],
   *   "query_utilizada": "receitas com ovo, tomate e cebola",
   *   "resumo": {
   *     "receitas_encontradas": 15,
   *     "ingredientes_usados": ["ovo", "tomate", "cebola", "leite", "pão"]
   *   }
   * }
   */
  @Get()
  @HttpCode(200)
  async sugerirReceitas(@Req() req: any): Promise<SuggestionResult> {
    try {
      const usuarioId = req.user.id;

      this.logger.log(`Sugerindo receitas para usuário ${usuarioId}`);

      const resultado =
        await this.recipeSuggestionService.sugerirReceitas(usuarioId);

      this.logger.log(
        `${resultado.receitas_sugeridas.length} receitas sugeridas para ${usuarioId}`,
      );

      return resultado;
    } catch (error) {
      this.logger.error('Erro ao sugerir receitas:', error);
      throw error;
    }
  }

  @Get('para-mim')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receitas personalizadas com score baseado no perfil aprendido' })
  async paraMim(
    @Req() req: any,
    @Query('modo_alimentar') modoAlimentar?: string,
  ): Promise<ReceitaParaMimResult[]> {
    return this.recipeSuggestionService.paraMim(req.user.id, modoAlimentar);
  }

  @Get('desafios')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receitas que você nunca fez e falta poucos ingredientes' })
  async desafios(@Req() req: any): Promise<ReceitaDesafioResult[]> {
    return this.recipeSuggestionService.desafios(req.user.id);
  }

  /**
   * GET /api/receitas/sugestoes/busca-manual
   *
   * Busca receitas usando query customizada
   * (Útil para teste manual)
   */
  @Get('busca-manual')
  @HttpCode(200)
  async buscarManual(@Req() req: any) {
    try {
      const usuarioId = req.user.id;
      const query = req.query.q || '';

      if (!query) {
        return {
          erro: 'Query não fornecida',
          dica: 'Use ?q=sua+busca',
        };
      }

      this.logger.log(
        `Busca manual para ${usuarioId}: "${query}"`,
      );

      // TODO: Implementar busca manual quando Google Search API estiver integrada
      return {
        query,
        receitas: [],
        mensagem:
          'Busca manual não implementada ainda. Use GET /receitas/sugestoes para busca automática.',
      };
    } catch (error) {
      this.logger.error('Erro em busca manual:', error);
      throw error;
    }
  }
}
