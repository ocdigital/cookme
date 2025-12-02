import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { CreateCompraDto } from './dto/create-compra.dto';
import { Produto } from '../produtos/entities/produto.entity';
import { ProductClassificationService } from '../product-classification/services/product-classification.service';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(CompraItem)
    private readonly compraItemRepository: Repository<CompraItem>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    private readonly productClassificationService: ProductClassificationService,
  ) {}

  /**
   * Cria uma compra com seus itens (transação com validação de produtos)
   */
  async create(usuarioId: string, createCompraDto: CreateCompraDto): Promise<Compra> {
    // Cria a compra
    const compra = this.compraRepository.create({
      usuario_id: usuarioId,
      data_compra: new Date(createCompraDto.data_compra),
      local_compra: createCompraDto.local_compra,
      valor_total: createCompraDto.valor_total,
      metodo_cadastro: createCompraDto.metodo_cadastro,
      tempo_cadastro_segundos: createCompraDto.tempo_cadastro_segundos,
    });

    const savedCompra = await this.compraRepository.save(compra);

    // Valida cada item da compra com Claude usando batch (mais eficiente)
    const itensValidados: CompraItem[] = [];

    try {
      // Busca todos os produtos para obter seus nomes
      const produtoIds = createCompraDto.itens
        .map((item) => item.produto_id)
        .filter((id) => id);

      let produtos: Produto[] = [];
      if (produtoIds.length > 0) {
        // Usar query builder para melhor suporte ao IN operator
        const query = this.produtoRepository.createQueryBuilder('produto');
        query.where('produto.id IN (:...ids)', { ids: produtoIds });
        produtos = await query.getMany();
      }

      // Cria mapa de produto_id -> produto para acesso rápido
      const produtoMap = new Map(produtos.map((p) => [p.id, p]));

      // Filtra itens com produtos válidos
      const itensComProduto = createCompraDto.itens.filter(
        (item) => produtoMap.has(item.produto_id),
      );

      if (itensComProduto.length === 0) {
        // Se nenhum produto válido, retorna compra vazia
        return this.findOne(savedCompra.id, usuarioId);
      }

      // Extrai nomes dos produtos para classificação em batch
      const nomeProdutos = itensComProduto.map((item) => {
        const produto = produtoMap.get(item.produto_id);
        return produto?.nome || '';
      }).filter(nome => nome !== '');

      // Classifica todos os produtos em UMA ÚNICA chamada à Claude
      const classificacoes = await this.productClassificationService.classificarEmBatch(
        nomeProdutos,
        usuarioId,
      );

      // Cria mapa de nome -> classificação para acesso rápido
      const classificacaoMap = new Map(
        classificacoes.map((clf) => [clf.produto, clf]),
      );

      // Processa cada item e adiciona apenas alimentos à compra
      const itensDescartados: string[] = [];

      for (const item of itensComProduto) {
        const produto = produtoMap.get(item.produto_id);
        if (!produto) continue;

        const classificacao = classificacaoMap.get(produto.nome);

        // Se for alimento, adiciona o item à compra
        if (
          classificacao &&
          classificacao.categoria === 'alimento'
        ) {
          const compraItem = this.compraItemRepository.create({
            compra_id: savedCompra.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            unidade: item.unidade,
            preco_unitario: item.preco_unitario,
            validade_final: item.validade_final ? new Date(item.validade_final) : null,
            lote: item.lote,
          });
          itensValidados.push(compraItem);
          console.log(`✅ ACEITO: ${produto.nome} (${classificacao.categoria})`);
        } else if (classificacao) {
          // Se não for alimento, registra como descartado
          itensDescartados.push(`${produto.nome} (${classificacao.categoria})`);
          console.log(`❌ DESCARTADO: ${produto.nome} (${classificacao.categoria}) - confidence: ${classificacao.confidence}`);
        }
      }

      // Log resumido
      if (itensDescartados.length > 0) {
        console.log(`\n📊 RESUMO DA VALIDAÇÃO:`);
        console.log(`   ✅ Itens aceitos: ${itensValidados.length}`);
        console.log(`   ❌ Itens descartados: ${itensDescartados.length}`);
        console.log(`   Descartados: ${itensDescartados.join(', ')}`);
      }
    } catch (error) {
      // Se houver erro na classificação em batch, loga mas continua com a compra vazia (segurança)
      console.error(`Erro ao classificar produtos em batch:`, error);
      // Não adiciona itens à compra se houver erro
    }

    // Salva apenas os itens válidos
    if (itensValidados.length > 0) {
      await this.compraItemRepository.save(itensValidados);
    }

    // Retorna a compra com seus itens validados
    return this.findOne(savedCompra.id, usuarioId);
  }

  /**
   * Lista compras do usuário
   */
  async findAll(usuarioId: string, limit = 20): Promise<Compra[]> {
    return this.compraRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['itens', 'itens.produto'],
      order: { data_compra: 'DESC' },
      take: limit,
    });
  }

  /**
   * Busca uma compra específica
   */
  async findOne(id: string, usuarioId: string): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['itens', 'itens.produto', 'itens.produto.marca'],
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }

    return compra;
  }

  /**
   * Remove uma compra (e seus itens em cascade)
   */
  async remove(id: string, usuarioId: string): Promise<void> {
    const compra = await this.findOne(id, usuarioId);
    await this.compraRepository.remove(compra);
  }

  /**
   * Estatísticas de compras do usuário
   */
  async getStats(usuarioId: string): Promise<{
    total_compras: number;
    valor_total: number;
    compra_media: number;
    ultima_compra: Date | null;
  }> {
    const compras = await this.compraRepository.find({
      where: { usuario_id: usuarioId },
      select: ['valor_total', 'data_compra'],
    });

    const total_compras = compras.length;
    const valor_total = compras.reduce((sum, c) => sum + Number(c.valor_total), 0);
    const compra_media = total_compras > 0 ? valor_total / total_compras : 0;
    const ultima_compra = total_compras > 0
      ? compras.sort((a, b) => b.data_compra.getTime() - a.data_compra.getTime())[0].data_compra
      : null;

    return {
      total_compras,
      valor_total: Math.round(valor_total * 100) / 100,
      compra_media: Math.round(compra_media * 100) / 100,
      ultima_compra,
    };
  }
}
