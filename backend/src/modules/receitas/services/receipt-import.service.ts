import { Injectable, Logger, Optional, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationService } from '../../notificacoes/services/push-notification.service';
import { Produto } from '../../produtos/entities/produto.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Compra } from '../../compras/entities/compra.entity';
import { CompraItem } from '../../compras/entities/compra-item.entity';
import { ItemReceipt } from './receipt-ocr.service';
import { ClassifiedProduct } from './product-classifier.service';
import { OcrAliasService } from '../../product-classification/services/ocr-alias.service';
import { ProductType } from '@common/enums/product-type.enum';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';

interface ImportOptions {
  data_compra?: string;
  loja?: string;
}

export interface ItemCompraResultado {
  compra_item_id: string;
  nome_ocr: string;
  nome_display: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  eh_alimento: boolean;
  confianca: number;
  ingrediente_canonical: string | null;
  adicionado_inventario: boolean;
}

export interface SalvarResultado {
  compra_id: string;
  ingredientes_adicionados: number;
  outros_itens: number;
  itens: ItemCompraResultado[];
  requer_validacao: boolean;
  // legado — mantidos para compatibilidade com o controller antigo
  produtos_adicionados: number;
  requer_validacao_legado: boolean;
  produtos_para_validar: Array<{
    nome: string;
    ingrediente_receita: boolean;
    confianca_classificacao: number;
    requer_validacao_manual: boolean;
    motivo: string;
  }>;
}

@Injectable()
export class ReceiptImportService {
  private readonly logger = new Logger(ReceiptImportService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(CompraItem)
    private readonly compraItemRepository: Repository<CompraItem>,
    @Optional()
    private readonly push: PushNotificationService,
    @Optional()
    private readonly ocrAlias: OcrAliasService,
  ) {}

  /**
   * Fluxo separado em dois domínios:
   *
   * 1. COMPRA (compra_itens) — registra TUDO que saiu do cupom:
   *    nome OCR, qtd, preço — usado para comparativo de listas/preços
   *
   * 2. INVENTÁRIO — apenas alimentos com canonical name confirmado:
   *    "frango", não "Frango Sadia 1kg" — sem qtd de mercado (qty=1)
   *    usado para busca de receitas
   */
  async salvarProdutosInventario(
    usuarioId: string,
    itemsExtraidos: ItemReceipt[],
    produtosClassificados: ClassifiedProduct[],
    options: ImportOptions,
  ): Promise<SalvarResultado> {

    const classificationMap = new Map<string, ClassifiedProduct>();
    for (const classified of produtosClassificados) {
      classificationMap.set(classified.nome.toLowerCase(), classified);
    }

    // ── 1. Criar registro da compra ──────────────────────────────────────
    const compra = this.compraRepository.create({
      usuario_id: usuarioId,
      data_compra: options.data_compra ? new Date(options.data_compra) : new Date(),
      local_compra: options.loja || null,
      metodo_cadastro: MetodoCadastro.OCR_NOTA,
      valor_total: itemsExtraidos.reduce((s, i) => s + (i.preco_total || 0), 0),
    } as any);
    const compraSalva = (await this.compraRepository.save(compra as any)) as Compra;

    const itensResultado: ItemCompraResultado[] = [];
    const produtosParaValidar: SalvarResultado['produtos_para_validar'] = [];
    let ingredientesAdicionados = 0;
    let requerValidacao = false;

    // Palavras que indicam claramente não-alimento — usado como fallback quando classificação não encontrada
    const BLACKLIST_NAO_ALIMENTO = ['detergente', 'sabonete', 'shampoo', 'condicionador', 'papel higienico',
      'lixo', 'desinfetante', 'cloro', 'agua sanitaria', 'pano', 'esponja', 'escova', 'cerveja',
      'vinho', 'chopp', 'cachaca', 'vodka', 'fraldas', 'absorvente', 'cotonete', 'antisseptico'];

    // ── 2. Processar cada item OCR ───────────────────────────────────────
    for (const item of itemsExtraidos) {
      // Busca classificação pelo nome exato; se não encontrar, tenta match parcial
      let classificacao = classificationMap.get(item.nome.toLowerCase());
      if (!classificacao) {
        // Match parcial: a IA pode ter devolvido nome levemente diferente
        const nomeNorm = item.nome.toLowerCase().replace(/\s+/g, ' ').trim();
        for (const [k, v] of classificationMap.entries()) {
          if (nomeNorm.includes(k) || k.includes(nomeNorm)) {
            classificacao = v;
            break;
          }
        }
      }

      // Fallback se ainda não encontrou: usa blacklist simples (tudo é alimento, exceto lista negra)
      let ehAlimento: boolean;
      let confianca: number;
      if (classificacao) {
        ehAlimento = classificacao.ingrediente_receita;
        confianca = classificacao.confianca;
      } else {
        const nomeLower = item.nome.toLowerCase();
        ehAlimento = !BLACKLIST_NAO_ALIMENTO.some((w) => nomeLower.includes(w));
        confianca = 60; // confiança baixa — requer validação manual
      }

      const canonical = this.ocrAlias
        ? await this.ocrAlias.resolverNomeCanônico(item.nome).catch(() => null)
        : null;

      const nomeDisplay = canonical || this.limpaNomeSimples(item.nome);

      // Criar CompraItem — item bruto do cupom com preço/qtd
      const compraItem = this.compraItemRepository.create({
        compra_id: compraSalva.id,
        produto_id: null,
        nome_ocr: item.nome,
        nome_display: nomeDisplay,
        quantidade: item.quantidade ?? 1,
        unidade: UnidadeMedida.UN,
        preco_unitario: item.preco_unitario ?? null,
        preco_total: item.preco_total ?? null,
        eh_alimento: ehAlimento,
        confianca,
        ingrediente_canonical: ehAlimento ? canonical : null,
        adicionado_inventario: false,
      } as any);
      const compraItemSalvo = (await this.compraItemRepository.save(compraItem as any)) as CompraItem;

      let adicionadoInventario = false;

      // ── 3. Inventário para todos os ingredientes classificados como alimento ────
      // canonical pode ser null se OcrAlias não reconhece o nome — fallback para nomeDisplay
      const nomeParaInventario = canonical || nomeDisplay;
      if (ehAlimento && nomeParaInventario) {
        try {
          let produto = await this.produtoRepository.findOne({
            where: { nome_display: nomeParaInventario, ingrediente_receita: true },
          });

          if (!produto) {
            produto = await this.produtoRepository.findOne({ where: { nome: nomeParaInventario } });
          }

          if (!produto) {
            produto = this.produtoRepository.create({
              nome: nomeParaInventario,
              nome_display: nomeParaInventario,
              tipo: ProductType.ALIMENTO,
              ingrediente_receita: true,
              confianca_classificacao: confianca,
              requer_validacao_manual: confianca < 75,
              unidade_padrao: UnidadeMedida.UN,
              origem: 'cupom_ocr',
            });
            produto = await this.produtoRepository.save(produto);
          }

          await this.compraItemRepository.update(compraItemSalvo.id, { produto_id: produto.id, ingrediente_canonical: nomeParaInventario } as any);

          const inventarioExistente = await this.inventarioRepository.findOne({
            where: { usuario_id: usuarioId, produto_id: produto.id },
          });

          if (inventarioExistente) {
            inventarioExistente.esgotado = false;
            (inventarioExistente as any).esgotado_em = null;
            await this.inventarioRepository.save(inventarioExistente);
          } else {
            const inv = this.inventarioRepository.create({
              usuario_id: usuarioId,
              produto_id: produto.id,
              quantidade_disponivel: 1,
              unidade: UnidadeMedida.UN,
              metodo_atualizacao: MetodoCadastro.OCR_NOTA,
            });
            await this.inventarioRepository.save(inv);
          }

          adicionadoInventario = true;
          ingredientesAdicionados++;
          await this.compraItemRepository.update(compraItemSalvo.id, { adicionado_inventario: true } as any);

          if (confianca < 75) {
            requerValidacao = true;
            produtosParaValidar.push({
              nome: nomeDisplay,
              ingrediente_receita: true,
              confianca_classificacao: confianca,
              requer_validacao_manual: true,
              motivo: classificacao?.motivo || 'Confiança baixa',
            });
          }
        } catch (error) {
          this.logger.error(`Erro ao adicionar ingrediente ${item.nome} ao inventário:`, error);
        }
      }

      itensResultado.push({
        compra_item_id: compraItemSalvo.id,
        nome_ocr: item.nome,
        nome_display: nomeDisplay,
        quantidade: item.quantidade ?? 1,
        preco_unitario: item.preco_unitario ?? 0,
        preco_total: item.preco_total ?? 0,
        eh_alimento: ehAlimento,
        confianca,
        ingrediente_canonical: ehAlimento ? canonical : null,
        adicionado_inventario: adicionadoInventario,
      });
    }

    if (ingredientesAdicionados > 0 && this.push) {
      this.push.enviarParaUsuario(
        usuarioId,
        '✅ Despensa atualizada',
        `${ingredientesAdicionados} ingrediente${ingredientesAdicionados > 1 ? 's' : ''} adicionado${ingredientesAdicionados > 1 ? 's' : ''} à sua despensa!`,
        { tipo: 'despensa_atualizada', rota: '/(app)/(tabs)/despensa' },
      ).catch(() => {});
    }

    const outrosItens = itensResultado.filter(i => !i.eh_alimento).length;
    this.logger.log(
      `Cupom ${compraSalva.id}: ${ingredientesAdicionados} ingredientes → inventário | ${outrosItens} outros → apenas compra`,
    );

    return {
      compra_id: compraSalva.id,
      ingredientes_adicionados: ingredientesAdicionados,
      outros_itens: outrosItens,
      itens: itensResultado,
      requer_validacao: requerValidacao,
      // legado
      produtos_adicionados: ingredientesAdicionados,
      requer_validacao_legado: requerValidacao,
      produtos_para_validar: produtosParaValidar,
    };
  }

  private limpaNomeSimples(nomeOcr: string): string {
    return nomeOcr
      .replace(/\s+\d+[\d.,]*\s*(KG|G|GR|ML|L|LT|UN|PC|PT|CX|KT|PKT)\b/gi, '')
      .replace(/\s+(BANDEJA|PACOTE|CAIXA|SACO|POTE|FRASCO|GARRAFA)\b/gi, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Valida manualmente um item da compra.
   * Se confirmado como ingrediente, adiciona ao inventário.
   */
  async validarItemManualmente(
    compraItemId: string,
    usuarioId: string,
    ehIngrediente: boolean,
  ): Promise<void> {
    const compraItem = await this.compraItemRepository.findOne({ where: { id: compraItemId } });
    if (!compraItem) throw new BadRequestException('Item não encontrado');

    await this.compraItemRepository.update(compraItemId, {
      eh_alimento: ehIngrediente,
      confianca: 100,
    } as any);

    if (ehIngrediente && !compraItem.adicionado_inventario) {
      const canonical = compraItem.ingrediente_canonical || compraItem.nome_display || compraItem.nome_ocr;

      let produto = await this.produtoRepository.findOne({
        where: { nome_display: canonical, ingrediente_receita: true },
      });

      if (!produto) {
        produto = this.produtoRepository.create({
          nome: canonical,
          nome_display: canonical,
          tipo: ProductType.ALIMENTO,
          ingrediente_receita: true,
          confianca_classificacao: 100,
          requer_validacao_manual: false,
          unidade_padrao: UnidadeMedida.UN,
          origem: 'cupom_ocr',
        });
        produto = await this.produtoRepository.save(produto);
      }

      const inventarioExistente = await this.inventarioRepository.findOne({
        where: { usuario_id: usuarioId, produto_id: produto.id },
      });

      if (!inventarioExistente) {
        const inv = this.inventarioRepository.create({
          usuario_id: usuarioId,
          produto_id: produto.id,
          quantidade_disponivel: 1,
          unidade: UnidadeMedida.UN,
          metodo_atualizacao: MetodoCadastro.MANUAL,
        });
        await this.inventarioRepository.save(inv);
      }

      await this.compraItemRepository.update(compraItemId, {
        produto_id: produto.id,
        adicionado_inventario: true,
      } as any);

      this.logger.log(`Item ${compraItem.nome_ocr} validado como ingrediente por ${usuarioId}`);
    }
  }

  /** Legado — mantido para compatibilidade com endpoint /validar */
  async validarProdutoManualmente(
    produtoId: string,
    usuarioId: string,
    ingrediente_receita: boolean,
  ): Promise<void> {
    const produto = await this.produtoRepository.findOne({ where: { id: produtoId } });
    if (!produto) throw new BadRequestException('Produto não encontrado');
    produto.ingrediente_receita = ingrediente_receita;
    produto.requer_validacao_manual = false;
    produto.confianca_classificacao = 100;
    await this.produtoRepository.save(produto);
  }

  async obterProdutosParaValidar(): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { requer_validacao_manual: true },
      order: { confianca_classificacao: 'ASC', criado_em: 'DESC' },
    });
  }
}
