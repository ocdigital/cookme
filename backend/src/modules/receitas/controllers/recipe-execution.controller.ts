import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Logger,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RecipeExecutionService, IniciarExecucaoResponse } from '../services/recipe-execution.service';

@ApiTags('Receitas - Execução')
@ApiBearerAuth()
@Controller('receitas')
@UseGuards(JwtAuthGuard)
export class RecipeExecutionController {
  private readonly logger = new Logger(RecipeExecutionController.name);

  constructor(
    private readonly recipeExecutionService: RecipeExecutionService,
  ) {}

  /**
   * Inicia execução de uma receita
   * POST /api/receitas/:id/executar
   */
  @Post(':id/executar')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar execução de uma receita' })
  @ApiResponse({
    status: 200,
    description: 'Execução iniciada com sucesso',
    schema: {
      example: {
        execucao_id: 'uuid',
        receita_id: 'uuid',
        status: 'em_andamento',
        ingredientes_necessarios: [
          {
            id: 'produto_id',
            nome: 'arroz',
            quantidade: 2,
            unidade: 'xícara',
            quantidade_disponivel: 5,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  async iniciarExecucao(
    @Param('id') receitaId: string,
    @Req() req: any,
  ): Promise<IniciarExecucaoResponse> {
    try {
      const usuarioId = req.user.id;

      this.logger.log(`Iniciando execução da receita ${receitaId} para usuário ${usuarioId}`);

      const resultado = await this.recipeExecutionService.iniciarExecucao(
        usuarioId,
        receitaId,
      );

      return resultado;
    } catch (error) {
      this.logger.error('Erro ao iniciar execução:', error);
      throw error;
    }
  }

  /**
   * Finaliza execução de uma receita
   * POST /api/receitas/:id/executar/:execucao_id/finalizar
   */
  @Post(':id/executar/:execucao_id/finalizar')
  @HttpCode(200)
  @ApiOperation({ summary: 'Finalizar execução de uma receita' })
  @ApiResponse({
    status: 200,
    description: 'Execução finalizada com sucesso',
    schema: {
      example: {
        status: 'sucesso',
        message: 'Receita executada com sucesso!',
        receita_id: 'uuid',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Execução não encontrada' })
  async finalizarExecucao(
    @Param('id') receitaId: string,
    @Param('execucao_id') execucaoId: string,
    @Req() req: any,
  ): Promise<{
    status: string;
    message: string;
    receita_id: string;
  }> {
    try {
      const usuarioId = req.user.id;

      this.logger.log(
        `Finalizando execução ${execucaoId} da receita ${receitaId} para usuário ${usuarioId}`,
      );

      const resultado = await this.recipeExecutionService.finalizarExecucao(
        usuarioId,
        receitaId,
        execucaoId,
      );

      return resultado;
    } catch (error) {
      this.logger.error('Erro ao finalizar execução:', error);
      throw error;
    }
  }

  /**
   * Lista histórico de execuções do usuário
   * GET /api/receitas/execucoes?page=1&limit=20
   */
  @Get('execucoes')
  @ApiOperation({ summary: 'Listar histórico de receitas executadas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de execuções',
  })
  async listarExecucoes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ) {
    try {
      const usuarioId = req.user.id;

      const resultado = await this.recipeExecutionService.listarExecucoes(
        usuarioId,
        page,
        limit,
      );

      return resultado;
    } catch (error) {
      this.logger.error('Erro ao listar execuções:', error);
      throw error;
    }
  }
}
