import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { InventarioService } from '../../inventario/inventario.service';

export interface IngredienteNecessario {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  quantidade_disponivel: number;
}

export interface IniciarExecucaoResponse {
  execucao_id: string;
  receita_id: string;
  status: string;
  ingredientes_necessarios: IngredienteNecessario[];
}

@Injectable()
export class RecipeExecutionService {
  private readonly logger = new Logger(RecipeExecutionService.name);

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepository: Repository<Receita>,
    @InjectRepository(ReceitaExecutada)
    private readonly receitaExecutadaRepository: Repository<ReceitaExecutada>,
    @InjectRepository(ReceitaIngrediente)
    private readonly receitaIngredienteRepository: Repository<ReceitaIngrediente>,
    private readonly inventarioService: InventarioService,
  ) {}

  /**
   * Inicia a execução de uma receita
   * 1. Verifica se a receita existe
   * 2. Cria registro em receitas_executadas
   * 3. Retorna lista de ingredientes necessários com quantidades disponíveis
   */
  async iniciarExecucao(
    usuarioId: string,
    receitaId: string,
  ): Promise<IniciarExecucaoResponse> {
    try {
      // 1. Buscar receita
      const receita = await this.receitaRepository.findOne({
        where: { id: receitaId },
        relations: ['ingredientes', 'ingredientes.produto'],
      });

      if (!receita) {
        throw new NotFoundException('Receita não encontrada');
      }

      // 2. Criar execução em banco
      const execucao = this.receitaExecutadaRepository.create({
        usuario_id: usuarioId,
        receita_id: receitaId,
        data_execucao: new Date(),
      });

      const executada = await this.receitaExecutadaRepository.save(execucao);

      // 3. Montar lista de ingredientes com quantidades disponíveis
      const ingredientesPronto: IngredienteNecessario[] = [];

      for (const ing of receita.ingredientes) {
        // Buscar no inventário do usuário
        const inventarioItem = await this.inventarioService.findByProdutoAndUsuario(
          usuarioId,
          ing.produto_id,
        );

        ingredientesPronto.push({
          id: ing.produto_id,
          nome: ing.produto.nome,
          quantidade: Number(ing.quantidade),
          unidade: ing.unidade,
          quantidade_disponivel: inventarioItem
            ? Number(inventarioItem.quantidade_disponivel)
            : 0,
        });
      }

      this.logger.log(
        `Execução iniciada: ${executada.id} para receita ${receitaId} do usuário ${usuarioId}`,
      );

      return {
        execucao_id: executada.id,
        receita_id: receitaId,
        status: 'em_andamento',
        ingredientes_necessarios: ingredientesPronto,
      };
    } catch (error) {
      this.logger.error('Erro ao iniciar execução:', error);
      throw error;
    }
  }

  /**
   * Finaliza a execução de uma receita
   * 1. Verifica se execução existe
   * 2. Incrementa contador vezes_executada em receita
   * 3. Retorna status de sucesso
   */
  async finalizarExecucao(
    usuarioId: string,
    receitaId: string,
    execucaoId: string,
  ): Promise<{
    status: string;
    message: string;
    receita_id: string;
  }> {
    try {
      // 1. Buscar execução
      const execucao = await this.receitaExecutadaRepository.findOne({
        where: {
          id: execucaoId,
          usuario_id: usuarioId,
          receita_id: receitaId,
        },
      });

      if (!execucao) {
        throw new NotFoundException('Execução não encontrada');
      }

      // 2. Incrementar vezes_executada
      const receita = await this.receitaRepository.findOne({
        where: { id: receitaId },
      });

      if (receita) {
        receita.vezes_executada = (receita.vezes_executada || 0) + 1;
        await this.receitaRepository.save(receita);
      }

      this.logger.log(
        `Execução finalizada: ${execucaoId} da receita ${receitaId}`,
      );

      return {
        status: 'sucesso',
        message: 'Receita executada com sucesso!',
        receita_id: receitaId,
      };
    } catch (error) {
      this.logger.error('Erro ao finalizar execução:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma execução
   */
  async obterExecucao(execucaoId: string, usuarioId: string): Promise<ReceitaExecutada> {
    const execucao = await this.receitaExecutadaRepository.findOne({
      where: {
        id: execucaoId,
        usuario_id: usuarioId,
      },
      relations: ['receita', 'usuario'],
    });

    if (!execucao) {
      throw new NotFoundException('Execução não encontrada');
    }

    return execucao;
  }

  /**
   * Lista histórico de execuções do usuário
   */
  async listarExecucoes(
    usuarioId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: ReceitaExecutada[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.receitaExecutadaRepository.findAndCount({
      where: { usuario_id: usuarioId },
      relations: ['receita'],
      order: { data_execucao: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
