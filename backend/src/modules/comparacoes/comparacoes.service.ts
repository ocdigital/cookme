import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from '@modules/compras/entities/compra.entity';
import { CompraItem } from '@modules/compras/entities/compra-item.entity';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { HistoricoPrecosProdutoQueryDto } from './dto/historico-precos-query.dto';
import { HistoricoPrecosProdutoResponseDto } from './dto/historico-precos-response.dto';
import { ComparacaoLocaisQueryDto } from './dto/comparacao-locais-query.dto';
import { ComparacaoLocaisResponseDto } from './dto/comparacao-locais-response.dto';
import { GastosCategoriaQueryDto } from './dto/gastos-categoria-query.dto';
import { GastosCategoriaResponseDto } from './dto/gastos-categoria-response.dto';
import { UnitConverter } from './utils/unit-converter.util';

@Injectable()
export class ComparacoesService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @InjectRepository(CompraItem)
    private compraItemRepository: Repository<CompraItem>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Retorna o histórico completo de preços de um produto específico
   * Normaliza preços para a unidade padrão do produto
   */
  async getHistoricoPrecosProduto(
    usuarioId: string,
    query: HistoricoPrecosProdutoQueryDto,
  ): Promise<HistoricoPrecosProdutoResponseDto> {
    // 1. Buscar produto e sua unidade padrão
    const produto = await this.produtoRepository.findOne({
      where: { id: query.produto_id },
      select: ['id', 'nome', 'unidade_padrao'],
    });

    if (!produto) {
      throw new NotFoundException(
        `Produto com ID ${query.produto_id} não encontrado`,
      );
    }

    // 2. Buscar todos os itens de compra deste produto
    let queryBuilder = this.compraItemRepository
      .createQueryBuilder('item')
      .select([
        'compra.data_compra',
        'item.preco_unitario',
        'item.quantidade',
        'item.unidade',
        'compra.local_compra',
        'compra.id',
      ])
      .leftJoin('item.compra', 'compra')
      .where('item.produto_id = :produtoId', { produtoId: query.produto_id })
      .andWhere('compra.usuario_id = :usuarioId', { usuarioId });

    // Aplicar filtros de data se fornecidos
    if (query.data_inicio) {
      queryBuilder.andWhere('compra.data_compra >= :dataInicio', {
        dataInicio: query.data_inicio,
      });
    }
    if (query.data_fim) {
      queryBuilder.andWhere('compra.data_compra <= :dataFim', {
        dataFim: query.data_fim,
      });
    }

    const items = await queryBuilder
      .orderBy('compra.data_compra', 'ASC')
      .getRawMany();

    // Se não há compras, retornar resposta vazia
    if (items.length === 0) {
      return {
        produto_id: produto.id,
        produto_nome: produto.nome,
        unidade_padrao: produto.unidade_padrao,
        preco_medio: 0,
        preco_minimo: 0,
        preco_maximo: 0,
        total_compras: 0,
        historico: [],
      };
    }

    // 3. Normalizar preços usando UnitConverter
    const historico = items.map((item) => {
      const precoNormalizado = UnitConverter.normalizarPreco(
        item.item_preco_unitario || 0,
        item.item_quantidade || 1,
        item.item_unidade,
        produto.unidade_padrao,
      );

      return {
        data_compra: item.compra_data_compra,
        preco_unitario_normalizado: precoNormalizado,
        quantidade_comprada: item.item_quantidade,
        unidade_comprada: item.item_unidade,
        local_compra: item.compra_local_compra,
        compra_id: item.compra_id,
      };
    });

    // 4. Calcular estatísticas
    const precos = historico.map((h) => h.preco_unitario_normalizado);
    const preco_medio =
      precos.reduce((a, b) => a + b, 0) / precos.length;
    const preco_minimo = Math.min(...precos);
    const preco_maximo = Math.max(...precos);

    return {
      produto_id: produto.id,
      produto_nome: produto.nome,
      unidade_padrao: produto.unidade_padrao,
      preco_medio: Math.round(preco_medio * 100) / 100,
      preco_minimo: Math.round(preco_minimo * 100) / 100,
      preco_maximo: Math.round(preco_maximo * 100) / 100,
      total_compras: historico.length,
      historico,
    };
  }

  /**
   * Compara preços entre diferentes locais de compra
   * Mostra qual supermercado/loja é mais barato em média
   */
  async getComparacaoLocais(
    usuarioId: string,
    query: ComparacaoLocaisQueryDto,
  ): Promise<ComparacaoLocaisResponseDto> {
    // Construir query base com agregações por local
    let queryBuilder = this.compraItemRepository
      .createQueryBuilder('item')
      .select('compra.local_compra', 'local')
      .addSelect('AVG(item.preco_unitario)', 'preco_medio')
      .addSelect('COUNT(DISTINCT compra.id)', 'total_compras')
      .addSelect('SUM(item.preco_total)', 'total_gasto')
      .leftJoin('item.compra', 'compra')
      .where('compra.usuario_id = :usuarioId', { usuarioId });

    // Filtros opcionais
    if (query.produto_id) {
      queryBuilder.andWhere('item.produto_id = :produtoId', {
        produtoId: query.produto_id,
      });
    }

    if (query.categoria_id) {
      queryBuilder
        .leftJoin('item.produto', 'produto')
        .andWhere('produto.categoria_id = :categoriaId', {
          categoriaId: query.categoria_id,
        });
    }

    if (query.data_inicio) {
      queryBuilder.andWhere('compra.data_compra >= :dataInicio', {
        dataInicio: query.data_inicio,
      });
    }

    if (query.data_fim) {
      queryBuilder.andWhere('compra.data_compra <= :dataFim', {
        dataFim: query.data_fim,
      });
    }

    const result = await queryBuilder
      .groupBy('compra.local_compra')
      .orderBy('AVG(item.preco_unitario)', 'ASC')
      .limit(query.limit || 50)
      .getRawMany();

    // Se não há dados, retornar array vazio
    if (result.length === 0) {
      return { locais: [] };
    }

    // Calcular média geral para economia
    const mediaGeral =
      result.reduce((sum, r) => sum + parseFloat(r.preco_medio), 0) /
      result.length;

    // Mapear resultados com cálculo de economia
    const locais = result.map((row) => {
      const precoMedio = parseFloat(row.preco_medio);
      return {
        local_compra: row.local || 'Não informado',
        preco_medio: Math.round(precoMedio * 100) / 100,
        total_compras: parseInt(row.total_compras, 10),
        total_gasto: Math.round(parseFloat(row.total_gasto) * 100) / 100,
        economia_vs_media: Math.round((mediaGeral - precoMedio) * 100) / 100,
      };
    });

    return { locais };
  }

  /**
   * Analisa distribuição de gastos por categoria
   * Mostra em quais categorias o usuário mais gasta
   */
  async getGastosPorCategoria(
    usuarioId: string,
    query: GastosCategoriaQueryDto,
  ): Promise<GastosCategoriaResponseDto> {
    let queryBuilder = this.compraItemRepository
      .createQueryBuilder('item')
      .select('categoria.id', 'categoria_id')
      .addSelect('categoria.nome', 'categoria_nome')
      .addSelect('SUM(item.preco_total)', 'total_gasto')
      .addSelect('COUNT(DISTINCT item.compra_id)', 'total_compras')
      .leftJoin('item.compra', 'compra')
      .leftJoin('item.produto', 'produto')
      .leftJoin('produto.categoria', 'categoria')
      .where('compra.usuario_id = :usuarioId', { usuarioId });

    // Filtros de data
    if (query.data_inicio) {
      queryBuilder.andWhere('compra.data_compra >= :dataInicio', {
        dataInicio: query.data_inicio,
      });
    }

    if (query.data_fim) {
      queryBuilder.andWhere('compra.data_compra <= :dataFim', {
        dataFim: query.data_fim,
      });
    }

    const categorias = await queryBuilder
      .groupBy('categoria.id, categoria.nome')
      .orderBy('SUM(item.preco_total)', 'DESC')
      .limit(query.limit || 10)
      .getRawMany();

    // Se não há dados, retornar vazio
    if (categorias.length === 0) {
      return {
        total_gasto: 0,
        categorias: [],
      };
    }

    // Calcular total geral
    const totalGeral = categorias.reduce(
      (sum, c) => sum + parseFloat(c.total_gasto || 0),
      0,
    );

    // Mapear com percentuais e ticket médio
    const categoriasFormatadas = categorias.map((cat) => {
      const totalGastoCategoria = parseFloat(cat.total_gasto || 0);
      const totalCompras = parseInt(cat.total_compras, 10);
      const percentual = (totalGastoCategoria / totalGeral) * 100;
      return {
        categoria_id: cat.categoria_id || null,
        categoria_nome: cat.categoria_nome || 'Sem categoria',
        total_gasto: Math.round(totalGastoCategoria * 100) / 100,
        percentual_total: Math.round(percentual * 100) / 100,
        total_compras: totalCompras,
        ticket_medio: Math.round(
          (totalGastoCategoria / totalCompras) * 100,
        ) / 100,
      };
    });

    return {
      total_gasto: Math.round(totalGeral * 100) / 100,
      categorias: categoriasFormatadas,
    };
  }
}
